import type { Turn } from "../../domain/aggregates/conversation.aggregate";
import type { AiProvider, ReplyChunkListener } from "../../application/ports/ai-provider";

type FakeAiProviderOptions = {
  chunks?: string[];
  failAfterChunk?: number;
};

export class FakeAiProvider implements AiProvider {
  private readonly chunks: string[];
  private readonly failAfterChunk?: number;
  receivedHistory: Turn[] = [];

  constructor(options: FakeAiProviderOptions = {}) {
    this.chunks = options.chunks ?? ["Hello", ", how ", "can I help?"];
    this.failAfterChunk = options.failAfterChunk;
  }

  async streamReply(history: Turn[], onChunk: ReplyChunkListener): Promise<void> {
    this.receivedHistory = history;
    let emitted = 0;
    for (const chunk of this.chunks) {
      if (this.failAfterChunk !== undefined && emitted >= this.failAfterChunk) {
        throw new Error("AI provider failed mid-stream.");
      }
      emitted += 1;
      onChunk(chunk);
    }
  }
}
