import { inject, injectable } from "inversify";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { ConversationRepository } from "../ports/conversation-repository";
import type { ImageGenerator } from "../ports/image-generator";
import { TYPES } from "../tokens";

export type GenerateImageInput = {
  conversationId?: string;
  prompt: string;
  modality: Modality;
};

@injectable()
export class GenerateImage {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
    @inject(TYPES.ImageGenerator)
    private readonly imageGenerator: ImageGenerator,
  ) {}

  async execute(input: GenerateImageInput): Promise<Conversation> {
    const conversation = await this.loadOrStart(input.conversationId);

    conversation.recordUserMessage(input.prompt, input.modality);
    await this.conversations.save(conversation);

    const image = await this.imageGenerator.generate(input.prompt);
    conversation.recordAssistantContent(Modality.text(), [image]);
    await this.conversations.save(conversation);

    return conversation;
  }

  private async loadOrStart(conversationId?: string): Promise<Conversation> {
    if (!conversationId) {
      return Conversation.start();
    }
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }
    return conversation;
  }
}
