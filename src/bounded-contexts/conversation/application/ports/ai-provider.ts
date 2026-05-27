import type { Turn } from "../../domain/aggregates/conversation.aggregate";

export type ReplyChunkKind = "answer" | "thought";

export type ReplyChunk = { kind: ReplyChunkKind; text: string };

export type ReplyChunkListener = (chunk: ReplyChunk) => void;

export interface AiProvider {
  streamReply(
    history: Turn[],
    onChunk: ReplyChunkListener,
    instruction?: string | null,
  ): Promise<void>;
}
