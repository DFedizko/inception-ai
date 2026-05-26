export type RecordedAudio = { data: string; mimeType: string };

export interface VoiceRecorder {
  isRecording: boolean;
  start(): Promise<void>;
  stop(): Promise<RecordedAudio>;
}

export type UseVoiceRecorder = () => VoiceRecorder;
