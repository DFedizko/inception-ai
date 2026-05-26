import { describe, expect, it } from "bun:test";
import { GeminiAiProvider, type GeminiContentClient } from "./ai-provider.gemini";

const streamOf = async function* (chunks: { text?: string }[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
};

const collect = async (
  provider: GeminiAiProvider,
  history: Parameters<GeminiAiProvider["streamReply"]>[0],
): Promise<string> => {
  let assembled = "";
  await provider.streamReply(history, (chunk) => (assembled += chunk));
  return assembled;
};

describe("GeminiAiProvider", () => {
  it("maps domain turns to Gemini contents and streams text chunks", async () => {
    let capturedArgs: { model: string; contents: unknown } | undefined;
    const client: GeminiContentClient = {
      models: {
        generateContentStream: async (args) => {
          capturedArgs = args;
          return streamOf([{ text: "Hel" }, { text: "lo" }]);
        },
      },
    };

    const assembled = await collect(new GeminiAiProvider(client, "gemini-3.5-flash"), [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hey" },
    ]);

    expect(assembled).toBe("Hello");
    expect(capturedArgs?.model).toBe("gemini-3.5-flash");
    expect(capturedArgs?.contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hey" }] },
    ]);
  });

  it("skips empty chunks", async () => {
    const client: GeminiContentClient = {
      models: {
        generateContentStream: async () => streamOf([{ text: "A" }, {}, { text: "B" }]),
      },
    };

    const assembled = await collect(new GeminiAiProvider(client), [{ role: "user", content: "x" }]);

    expect(assembled).toBe("AB");
  });
});
