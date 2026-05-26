export type MicFrame = Int16Array;

export type OnMicFrame = (frame: MicFrame) => void;

export interface MicStream {
  isCapturing: boolean;
  error: Error | null;
  start(onFrame: OnMicFrame): Promise<void>;
  stop(): Promise<void>;
  getLevel(): number;
}

export interface AudioSink {
  isPlaying: boolean;
  error: Error | null;
  start(): void;
  stop(): void;
  enqueue(pcm: Int16Array): void;
  getLevel(): number;
}

export type UseMicStream = () => MicStream;
export type UseAudioSink = () => AudioSink;
