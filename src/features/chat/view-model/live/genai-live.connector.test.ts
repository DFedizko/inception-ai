import { describe, expect, it } from "bun:test";

import { GenAiLiveConnector } from "./genai-live.connector";
import type { LiveSessionCallbacks } from "./live-session.port";

type Captured = {
  model?: string;
  config?: { responseModalities?: unknown[] };
  onmessage?: (message: unknown) => void;
  onerror?: (error: unknown) => void;
  onclose?: () => void;
  realtime: { data: string; mimeType: string }[];
  clientContent: {
    turns: { role: string; parts: { text: string }[] }[];
    turnComplete?: boolean;
  }[];
  closed: boolean;
};

const fakeFactory = (captured: Captured) => () => ({
  live: {
    connect: async (args: {
      model: string;
      config: { responseModalities?: unknown[] };
      callbacks: {
        onmessage: (message: unknown) => void;
        onerror?: (error: unknown) => void;
        onclose?: () => void;
      };
    }) => {
      captured.model = args.model;
      captured.config = args.config;
      captured.onmessage = args.callbacks.onmessage;
      captured.onerror = args.callbacks.onerror;
      captured.onclose = args.callbacks.onclose;
      return {
        sendRealtimeInput: (input: { media: { data: string; mimeType: string } }) =>
          captured.realtime.push(input.media),
        sendClientContent: (input: {
          turns: { role: string; parts: { text: string }[] }[];
          turnComplete?: boolean;
        }) => captured.clientContent.push(input),
        close: () => {
          captured.closed = true;
        },
      };
    },
  },
});

const collectingCallbacks = () => {
  const events = {
    audio: [] as Int16Array[],
    input: [] as string[],
    output: [] as string[],
    turnComplete: 0,
    interrupted: 0,
    errors: [] as Error[],
    closes: 0,
  };
  const callbacks: LiveSessionCallbacks = {
    onAudioFrame: (pcm) => events.audio.push(pcm),
    onInputTranscript: (text) => events.input.push(text),
    onOutputTranscript: (text) => events.output.push(text),
    onTurnComplete: () => (events.turnComplete += 1),
    onInterrupted: () => (events.interrupted += 1),
    onError: (error) => events.errors.push(error),
    onClose: () => (events.closes += 1),
  };
  return { events, callbacks };
};

const newCaptured = (): Captured => ({
  realtime: [],
  clientContent: [],
  closed: false,
});

describe("genai live connector", () => {
  it("connects with the audio modality and transcription config", async () => {
    const captured = newCaptured();
    const { callbacks } = collectingCallbacks();

    await new GenAiLiveConnector(fakeFactory(captured)).connect(
      { token: "tk", model: "live-model", history: [] },
      callbacks,
    );

    expect(captured.model).toBe("live-model");
    expect(captured.config?.responseModalities).toHaveLength(1);
  });

  it("seeds prior history without completing the turn", async () => {
    const captured = newCaptured();
    const { callbacks } = collectingCallbacks();

    await new GenAiLiveConnector(fakeFactory(captured)).connect(
      {
        token: "tk",
        model: "live-model",
        history: [
          { role: "user", content: "oi" },
          { role: "assistant", content: "olá" },
        ],
      },
      callbacks,
    );

    expect(captured.clientContent[0].turnComplete).toBe(false);
    expect(captured.clientContent[0].turns).toEqual([
      { role: "user", parts: [{ text: "oi" }] },
      { role: "assistant", parts: [{ text: "olá" }] },
    ]);
  });

  it("sends mic frames as base64 pcm at 16 kHz", async () => {
    const captured = newCaptured();
    const { callbacks } = collectingCallbacks();

    const session = await new GenAiLiveConnector(fakeFactory(captured)).connect(
      { token: "tk", model: "live-model", history: [] },
      callbacks,
    );

    session.sendAudioFrame(Int16Array.from([1, -1, 32767]));

    expect(captured.realtime[0].mimeType).toBe("audio/pcm;rate=16000");
    expect(captured.realtime[0].data.length).toBeGreaterThan(0);
  });

  it("sends typed text as a completed user turn", async () => {
    const captured = newCaptured();
    const { callbacks } = collectingCallbacks();

    const session = await new GenAiLiveConnector(fakeFactory(captured)).connect(
      { token: "tk", model: "live-model", history: [] },
      callbacks,
    );

    session.sendText("fale comigo");

    expect(captured.clientContent.at(-1)).toEqual({
      turns: [{ role: "user", parts: [{ text: "fale comigo" }] }],
      turnComplete: true,
    });
  });

  it("decodes audio frames, transcripts and lifecycle from server messages", async () => {
    const captured = newCaptured();
    const { events, callbacks } = collectingCallbacks();

    await new GenAiLiveConnector(fakeFactory(captured)).connect(
      { token: "tk", model: "live-model", history: [] },
      callbacks,
    );

    const audioBase64 = btoa(String.fromCharCode(0, 1, 2, 3));
    captured.onmessage?.({
      serverContent: {
        modelTurn: { parts: [{ inlineData: { data: audioBase64 } }] },
        inputTranscription: { text: "ouvi você" },
        outputTranscription: { text: "minha resposta" },
        turnComplete: true,
      },
    });

    expect(events.audio[0]).toBeInstanceOf(Int16Array);
    expect(events.input).toEqual(["ouvi você"]);
    expect(events.output).toEqual(["minha resposta"]);
    expect(events.turnComplete).toBe(1);
  });

  it("reports interruption (barge-in) from the server", async () => {
    const captured = newCaptured();
    const { events, callbacks } = collectingCallbacks();

    await new GenAiLiveConnector(fakeFactory(captured)).connect(
      { token: "tk", model: "live-model", history: [] },
      callbacks,
    );

    captured.onmessage?.({ serverContent: { interrupted: true } });

    expect(events.interrupted).toBe(1);
  });

  it("surfaces errors and close", async () => {
    const captured = newCaptured();
    const { events, callbacks } = collectingCallbacks();

    const session = await new GenAiLiveConnector(fakeFactory(captured)).connect(
      { token: "tk", model: "live-model", history: [] },
      callbacks,
    );

    captured.onerror?.(new Error("boom"));
    captured.onclose?.();
    await session.close();

    expect(events.errors[0].message).toBe("boom");
    expect(events.closes).toBe(1);
    expect(captured.closed).toBe(true);
  });
});
