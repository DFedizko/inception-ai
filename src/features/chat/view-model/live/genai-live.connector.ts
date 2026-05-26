import { GoogleGenAI, Modality } from "@google/genai";

import type {
  LiveSession,
  LiveSessionCallbacks,
  LiveSessionConfig,
  LiveSessionConnector,
} from "./live-session.port";

type ServerMessage = {
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { data?: string } }[] };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
};

type GenAiSession = {
  sendRealtimeInput(input: { media: { data: string; mimeType: string } }): void;
  sendClientContent(input: {
    turns: { role: string; parts: { text: string }[] }[];
    turnComplete?: boolean;
  }): void;
  close(): void;
};

type GenAiClient = {
  live: {
    connect(args: {
      model: string;
      config: unknown;
      callbacks: {
        onopen?: () => void;
        onmessage: (message: ServerMessage) => void;
        onerror?: (error: unknown) => void;
        onclose?: () => void;
      };
    }): Promise<GenAiSession>;
  };
};

export type GenAiClientFactory = (token: string) => GenAiClient;

const INPUT_MIME_TYPE = "audio/pcm;rate=16000";

const defaultFactory: GenAiClientFactory = (token) =>
  new GoogleGenAI({
    apiKey: token,
    httpOptions: { apiVersion: "v1alpha" },
  }) as unknown as GenAiClient;

export class GenAiLiveConnector implements LiveSessionConnector {
  constructor(private readonly createClient: GenAiClientFactory = defaultFactory) {}

  async connect(
    config: LiveSessionConfig,
    callbacks: LiveSessionCallbacks,
  ): Promise<LiveSession> {
    const client = this.createClient(config.token);
    const session = await client.live.connect({
      model: config.model,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        ...(config.instruction ? { systemInstruction: config.instruction } : {}),
      },
      callbacks: {
        onmessage: (message) => this.handleMessage(message, callbacks),
        onerror: (error) =>
          callbacks.onError(error instanceof Error ? error : new Error("live session error")),
        onclose: () => callbacks.onClose(),
      },
    });

    if (config.history.length > 0) {
      session.sendClientContent({
        turns: config.history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.content }],
        })),
        turnComplete: false,
      });
    }

    return {
      sendAudioFrame: (frame) =>
        session.sendRealtimeInput({
          media: { data: encodePcm(frame), mimeType: INPUT_MIME_TYPE },
        }),
      sendText: (text) =>
        session.sendClientContent({
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        }),
      close: async () => session.close(),
    };
  }

  private handleMessage(message: ServerMessage, callbacks: LiveSessionCallbacks): void {
    const content = message.serverContent;
    if (!content) return;
    for (const part of content.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (data) callbacks.onAudioFrame(decodePcm(data));
    }
    if (content.inputTranscription?.text) {
      callbacks.onInputTranscript(content.inputTranscription.text);
    }
    if (content.outputTranscription?.text) {
      callbacks.onOutputTranscript(content.outputTranscription.text);
    }
    if (content.interrupted) callbacks.onInterrupted();
    if (content.turnComplete) callbacks.onTurnComplete();
  }
}

const encodePcm = (frame: Int16Array): string => {
  const bytes = new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
};

const decodePcm = (base64: string): Int16Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
};
