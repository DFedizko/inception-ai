import type { Role } from "../../model/message.model";

export type LiveHistoryTurn = { role: Role; content: string };

export type LiveSessionConfig = {
  token: string;
  model: string;
  history: LiveHistoryTurn[];
  instruction?: string;
};

export type LiveSessionCallbacks = {
  onAudioFrame: (pcm: Int16Array) => void;
  onInputTranscript: (text: string) => void;
  onOutputTranscript: (text: string) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onError: (error: Error) => void;
  onClose: () => void;
};

export interface LiveSession {
  sendAudioFrame(frame: Int16Array): void;
  sendText(text: string): void;
  close(): Promise<void>;
}

export interface LiveSessionConnector {
  connect(
    config: LiveSessionConfig,
    callbacks: LiveSessionCallbacks,
  ): Promise<LiveSession>;
}
