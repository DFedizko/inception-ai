import { useAudioSink as useSharedAudioSink } from "@/features/shared/hooks/useAudioSink";
import { useMicStream as useSharedMicStream } from "@/features/shared/hooks/useMicStream";

import type { UseAudioSink, UseMicStream } from "./audio.ports";

let useMic: UseMicStream = useSharedMicStream;
let useSink: UseAudioSink = useSharedAudioSink;

export const useMicStream: UseMicStream = () => useMic();
export const useAudioSink: UseAudioSink = () => useSink();

export const setAudioHooks = (mic: UseMicStream, sink: UseAudioSink): void => {
  useMic = mic;
  useSink = sink;
};
