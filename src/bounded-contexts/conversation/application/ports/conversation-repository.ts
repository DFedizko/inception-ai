import type { Conversation } from "../../domain/aggregates/conversation.aggregate";

export interface ConversationRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
}
