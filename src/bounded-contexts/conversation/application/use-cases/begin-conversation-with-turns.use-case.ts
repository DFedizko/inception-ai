import { inject, injectable } from "inversify";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import type { RecordedTurn } from "./record-turns.use-case";
import type { ConversationRepository } from "../ports/conversation-repository";
import { TYPES } from "../tokens";

export type BeginConversationWithTurnsInput = {
  turns: RecordedTurn[];
};

@injectable()
export class BeginConversationWithTurns {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
  ) {}

  async execute(input: BeginConversationWithTurnsInput): Promise<Conversation> {
    const conversation = Conversation.start();

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
