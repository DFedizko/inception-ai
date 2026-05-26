import { describe, expect, it } from "bun:test";
import {
  extractTranscript,
  type GeminiTranscriptionClient,
  GeminiTranscriber,
} from "./transcriber.gemini";

describe("extractTranscript", () => {
  it("prefers the response text shortcut", () => {
    expect(extractTranscript({ text: "olá mundo" })).toBe("olá mundo");
  });

  it("falls back to joining candidate parts", () => {
    expect(
      extractTranscript({ candidates: [{ content: { parts: [{ text: "olá " }, { text: "mundo" }] } }] }),
    ).toBe("olá mundo");
  });
});

describe("GeminiTranscriber", () => {
  it("sends the audio inline and returns the trimmed transcript", async () => {
    const calls: { model: string; contents: unknown }[] = [];
    const client: GeminiTranscriptionClient = {
      models: {
        generateContent: async (args) => {
          calls.push(args);
          return { text: "  um gato astronauta  " };
        },
      },
    };

    const transcript = await new GeminiTranscriber(client, "gemini-3.5-flash").transcribe({
      data: new Uint8Array([1, 2, 3]),
      mimeType: "audio/webm",
    });

    expect(transcript).toBe("um gato astronauta");
    expect(calls[0]?.model).toBe("gemini-3.5-flash");
  });
});
