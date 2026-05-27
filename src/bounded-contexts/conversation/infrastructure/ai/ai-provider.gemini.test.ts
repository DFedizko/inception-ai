import { describe, expect, it } from "bun:test";
import { GeminiAiProvider, type GeminiContentClient } from "./ai-provider.gemini";

type FakePart = { text?: string; thought?: boolean };

const chunkOf = (...parts: FakePart[]) => ({ candidates: [{ content: { parts } }] });

const streamOf = <T>(chunks: T[]): AsyncIterable<T> => ({
  [Symbol.asyncIterator]: () => {
    let index = 0;
    return {
      next: () =>
        Promise.resolve(
          index < chunks.length ? { value: chunks[index++], done: false } : { value: undefined, done: true },
        ),
    };
  },
});

const collect = async (
  provider: GeminiAiProvider,
  history: Parameters<GeminiAiProvider["streamReply"]>[0],
): Promise<{ answer: string; thoughts: string }> => {
  let answer = "";
  let thoughts = "";
  await provider.streamReply(history, (chunk) => {
    if (chunk.kind === "thought") return void (thoughts += chunk.text);
    answer += chunk.text;
  });
  return { answer, thoughts };
};

describe("GeminiAiProvider", () => {
  it("maps domain turns to Gemini contents, asks for thoughts, and streams the answer", async () => {
    let capturedArgs: { model: string; contents: unknown; config?: unknown } | undefined;
    const client: GeminiContentClient = {
      models: {
        generateContentStream: async (args) => {
          capturedArgs = args;
          return streamOf([chunkOf({ text: "Hel" }), chunkOf({ text: "lo" })]);
        },
      },
    };

    const { answer } = await collect(new GeminiAiProvider(client, "gemini-3.5-flash"), [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hey" },
    ]);

    expect(answer).toBe("Hello");
    expect(capturedArgs?.model).toBe("gemini-3.5-flash");
    expect(capturedArgs?.contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hey" }] },
    ]);
    expect(capturedArgs?.config).toMatchObject({ thinkingConfig: { includeThoughts: true } });
  });

  it("separates thought parts from answer parts", async () => {
    const client: GeminiContentClient = {
      models: {
        generateContentStream: async () =>
          streamOf([chunkOf({ text: "Let me think", thought: true }), chunkOf({ text: "42" })]),
      },
    };

    const { answer, thoughts } = await collect(new GeminiAiProvider(client), [
      { role: "user", content: "x" },
    ]);

    expect(thoughts).toBe("Let me think");
    expect(answer).toBe("42");
  });

  it("skips empty parts", async () => {
    const client: GeminiContentClient = {
      models: {
        generateContentStream: async () => streamOf([chunkOf({ text: "A" }, {}), chunkOf({ text: "B" })]),
      },
    };

    const { answer } = await collect(new GeminiAiProvider(client), [{ role: "user", content: "x" }]);

    expect(answer).toBe("AB");
  });
});
