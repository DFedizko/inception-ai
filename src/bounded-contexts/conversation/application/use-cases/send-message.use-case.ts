import { inject, injectable } from "inversify";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { AiProvider, ReplyChunkListener } from "../ports/ai-provider";
import type { ConversationRepository } from "../ports/conversation-repository";
import { TYPES } from "../tokens";

export type SendMessageInput = {
  conversationId: string;
  content: string;
  modality: Modality;
};

@injectable()
export class SendMessage {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
    @inject(TYPES.AiProvider)
    private readonly ai: AiProvider,
  ) {}

  async execute(input: SendMessageInput, onChunk: ReplyChunkListener): Promise<void> {
    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    conversation.recordUserMessage(input.content, input.modality);
    await this.conversations.save(conversation);

    const generationStartedAt = Date.now();
    let assembledReply = "";
    await this.ai.streamReply(
      conversation.history(),
      (chunk) => {
        if (chunk.kind === "answer") assembledReply += chunk.text;
        onChunk(chunk);
      },
      conversation.instructionText(),
    );

    conversation.recordAssistantReply(assembledReply, Modality.text(), Date.now() - generationStartedAt);
    await this.conversations.save(conversation);
  }
}
