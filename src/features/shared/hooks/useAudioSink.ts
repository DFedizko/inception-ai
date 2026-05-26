import { useCallback, useRef, useState } from "react";

import { peakLevel } from "@/features/shared/utils/audio-level";

type AudioContextConstructor = new (options?: { sampleRate?: number }) => AudioContext;

const OUTPUT_SAMPLE_RATE = 24000;

type Sink = {
  context: AudioContext;
  playhead: number;
  pending: number;
};

export const useAudioSink = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sink = useRef<Sink | null>(null);
  const level = useRef(0);

  const start = useCallback(() => {
    setError(null);
    if (sink.current) {
      void sink.current.context.resume();
      return;
    }
    const AudioContextCtor = resolveAudioContext();
    if (!AudioContextCtor) {
      setError(new Error("Audio playback is not supported in this browser"));
      return;
    }
    const context = new AudioContextCtor({ sampleRate: OUTPUT_SAMPLE_RATE });
    sink.current = { context, playhead: 0, pending: 0 };
  }, []);

  const stop = useCallback(() => {
    const active = sink.current;
    sink.current = null;
    level.current = 0;
    setIsPlaying(false);
    if (active) void active.context.close();
  }, []);

  const enqueue = useCallback((pcm: Int16Array) => {
    const active = sink.current;
    if (!active) {
      setError(new Error("Audio playback is not started"));
      return;
    }
    level.current = peakLevel(pcm);
    const { context } = active;
    const buffer = context.createBuffer(1, pcm.length, OUTPUT_SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < pcm.length; index += 1) {
      channel[index] = pcm[index] / 0x8000;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime, active.playhead);
    active.playhead = startAt + buffer.length / OUTPUT_SAMPLE_RATE;
    active.pending += 1;
    setIsPlaying(true);
    source.onended = () => {
      if (sink.current !== active) return;
      active.pending -= 1;
      if (active.pending <= 0) setIsPlaying(false);
    };
    source.start(startAt);
  }, []);

  const getLevel = useCallback(() => level.current, []);

  return { isPlaying, error, start, stop, enqueue, getLevel };
};

const resolveAudioContext = (): AudioContextConstructor | undefined => {
  const scope = globalThis as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
};
