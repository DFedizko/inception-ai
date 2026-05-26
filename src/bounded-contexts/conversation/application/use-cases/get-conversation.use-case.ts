import { inject, injectable } from "inversify";
import type { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { ConversationRepository } from "../ports/conversation-repository";
import { TYPES } from "../tokens";

@injectable()
export class GetConversation {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
  ) {}

  async execute(id: string): Promise<Conversation> {
    const conversation = await this.conversations.findById(id);
    if (!conversation) {
      throw new ConversationNotFoundError(id);
    }
    return conversation;
  }
}
