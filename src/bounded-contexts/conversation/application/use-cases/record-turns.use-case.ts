import { inject, injectable } from "inversify";
import type { Conversation } from "../../domain/aggregates/conversation.aggregate";
import type { Modality } from "../../domain/value-objects/modality.value-object";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { ConversationRepository } from "../ports/conversation-repository";
import { TYPES } from "../tokens";

export type RecordedTurn = {
  role: "user" | "assistant";
  modality: Modality;
  content: string;
};

export type RecordTurnsInput = {
  conversationId: string;
  turns: RecordedTurn[];
};

@injectable()
export class RecordTurns {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
  ) {}

  async execute(input: RecordTurnsInput): Promise<Conversation> {
    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    for (const turn of input.turns) {
      if (turn.role === "user") {
        conversation.recordUserMessage(turn.content, turn.modality);
      } else {
        conversation.recordAssistantReply(turn.content, turn.modality);
      }
    }

    await this.conversations.save(conversation);
    return conversation;
  }
}
