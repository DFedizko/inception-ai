import type { Turn } from "../../domain/aggregates/conversation.aggregate";

export type ReplyChunkListener = (chunk: string) => void;

export interface AiProvider {
  streamReply(
    history: Turn[],
    onChunk: ReplyChunkListener,
    instruction?: string | null,
  ): Promise<void>;
}
