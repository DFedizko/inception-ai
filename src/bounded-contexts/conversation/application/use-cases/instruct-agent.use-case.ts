import { inject, injectable } from "inversify";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Instruction } from "../../domain/value-objects/instruction.value-object";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { ConversationRepository } from "../ports/conversation-repository";
import { TYPES } from "../tokens";

export type InstructAgentInput = {
  conversationId: string;
  instruction: string;
};

@injectable()
export class InstructAgent {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
  ) {}

  async execute(input: InstructAgentInput): Promise<Conversation> {
    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    conversation.instruct(Instruction.of(input.instruction));
    await this.conversations.save(conversation);
    return conversation;
  }
}
