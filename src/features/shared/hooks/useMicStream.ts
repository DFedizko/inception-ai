import { useCallback, useRef, useState } from "react";

import { rmsLevel } from "@/features/shared/utils/audio-level";

type MicFrame = Int16Array;

type OnFrame = (frame: MicFrame) => void;

type AudioContextConstructor = new (options?: { sampleRate?: number }) => AudioContext;

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

type Capture = {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
};

export const useMicStream = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const capture = useRef<Capture | null>(null);
  const level = useRef(0);

  const start = useCallback(async (onFrame: OnFrame) => {
    setError(null);
    const AudioContextCtor = resolveAudioContext();
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextCtor) {
      setError(new Error("Microphone streaming is not supported in this browser"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContextCtor({ sampleRate: TARGET_SAMPLE_RATE });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processor.onaudioprocess = (event) => {
        const samples = event.inputBuffer.getChannelData(0);
        level.current = rmsLevel(samples);
        const resampled = resample(samples, context.sampleRate, TARGET_SAMPLE_RATE);
        onFrame(toPcm16(resampled));
      };
      source.connect(processor);
      processor.connect(context.destination);
      capture.current = { stream, context, source, processor };
      setIsCapturing(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Microphone access failed"));
      setIsCapturing(false);
    }
  }, []);

  const stop = useCallback(async () => {
    const active = capture.current;
    capture.current = null;
    level.current = 0;
    setIsCapturing(false);
    if (!active) return;
    active.processor.onaudioprocess = null;
    active.source.disconnect();
    active.processor.disconnect();
    active.stream.getTracks().forEach((track) => track.stop());
    await active.context.close();
  }, []);

  const getLevel = useCallback(() => level.current, []);

  return { isCapturing, error, start, stop, getLevel };
};

const resolveAudioContext = (): AudioContextConstructor | undefined => {
  const scope = globalThis as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
};

const resample = (samples: Float32Array, fromRate: number, toRate: number): Float32Array => {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const length = Math.round(samples.length / ratio);
  const result = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    result[index] = samples[Math.floor(index * ratio)];
  }
  return result;
};

const toPcm16 = (samples: Float32Array): Int16Array => {
  const pcm = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    pcm[index] = Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff);
  }
  return pcm;
};
