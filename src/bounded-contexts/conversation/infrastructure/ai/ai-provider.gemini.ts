import { GoogleGenAI } from "@google/genai";
import type { Turn } from "../../domain/aggregates/conversation.aggregate";
import type { AiProvider, ReplyChunkListener } from "../../application/ports/ai-provider";

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

type GeminiChunk = { text?: string };

export interface GeminiContentClient {
  models: {
    generateContentStream(args: {
      model: string;
      contents: GeminiContent[];
      config?: { systemInstruction?: string };
    }): Promise<AsyncIterable<GeminiChunk>>;
  };
}

const defaultModel = "gemini-3.5-flash";

export class GeminiAiProvider implements AiProvider {
  constructor(
    private readonly client: GeminiContentClient,
    private readonly model: string = process.env.GEMINI_MODEL ?? defaultModel,
  ) {}

  async streamReply(
    history: Turn[],
    onChunk: ReplyChunkListener,
    instruction?: string | null,
  ): Promise<void> {
    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents: history.map((turn) => this.toContent(turn)),
      ...(instruction ? { config: { systemInstruction: instruction } } : {}),
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  }

  private toContent(turn: Turn): GeminiContent {
    return {
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    };
  }
}

export const createGeminiAiProvider = (): GeminiAiProvider => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GeminiAiProvider(new GoogleGenAI({ apiKey }));
};
