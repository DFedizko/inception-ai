import { useCallback, useRef, useState } from "react";

type MicFrame = Int16Array;

type OnFrame = (frame: MicFrame) => void;

type AudioContextConstructor = new () => AudioContext;

const WORKLET_URL = "/audio-worklets/pcm-capture-worklet.js";
const WORKLET_PROCESSOR = "pcm-capture-processor";

type WorkletMessage = { pcm: Int16Array; level: number };

type Capture = {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  worklet: AudioWorkletNode;
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
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContextCtor();
      await context.audioWorklet.addModule(WORKLET_URL);
      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, WORKLET_PROCESSOR);
      worklet.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
        level.current = event.data.level;
        onFrame(event.data.pcm);
      };
      source.connect(worklet);
      capture.current = { stream, context, source, worklet };
      setIsCapturing(true);
    } catch (cause) {
      stopTracks(stream);
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
    active.worklet.port.onmessage = null;
    active.worklet.disconnect();
    active.source.disconnect();
    stopTracks(active.stream);
    if (active.context.state !== "closed") await active.context.close();
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

const stopTracks = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach((track) => track.stop());
};
