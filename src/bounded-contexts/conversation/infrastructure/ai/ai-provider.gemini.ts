import { GoogleGenAI } from "@google/genai";
import type { Turn } from "../../domain/aggregates/conversation.aggregate";
import type { AiProvider, ReplyChunkListener } from "../../application/ports/ai-provider";

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

type GeminiPart = { text?: string; thought?: boolean };

type GeminiChunk = { candidates?: { content?: { parts?: GeminiPart[] } }[] };

type GeminiConfig = {
  systemInstruction?: string;
  thinkingConfig?: { includeThoughts?: boolean };
};

export interface GeminiContentClient {
  models: {
    generateContentStream(args: {
      model: string;
      contents: GeminiContent[];
      config?: GeminiConfig;
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
      config: {
        thinkingConfig: { includeThoughts: true },
        ...(instruction ? { systemInstruction: instruction } : {}),
      },
    });

    for await (const chunk of stream) {
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if (!part.text) continue;
        onChunk({ kind: part.thought ? "thought" : "answer", text: part.text });
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
