import type { Conversation } from "../../domain/aggregates/conversation.aggregate";
import type { ConversationRepository } from "../../application/ports/conversation-repository";
import type {
  ConversationSummaries,
  ConversationSummary,
} from "../../application/ports/conversation-summaries";

export class InMemoryConversationRepository
  implements ConversationRepository, ConversationSummaries
{
  private readonly store = new Map<string, Conversation>();

  async save(conversation: Conversation): Promise<void> {
    this.store.set(conversation.id, conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.store.get(id) ?? null;
  }

  async listNewestFirst(): Promise<ConversationSummary[]> {
    return [...this.store.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title.toString(),
        createdAt: conversation.createdAt,
      }));
  }
}
