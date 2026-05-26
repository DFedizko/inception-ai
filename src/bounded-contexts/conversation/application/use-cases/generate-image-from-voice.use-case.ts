import { inject, injectable } from "inversify";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { AudioPrompt, Transcriber } from "../ports/transcriber";
import type { ConversationRepository } from "../ports/conversation-repository";
import type { ImageGenerator } from "../ports/image-generator";
import { TYPES } from "../tokens";

export type GenerateImageFromVoiceInput = {
  conversationId?: string;
  audio: AudioPrompt;
};

@injectable()
export class GenerateImageFromVoice {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
    @inject(TYPES.Transcriber)
    private readonly transcriber: Transcriber,
    @inject(TYPES.ImageGenerator)
    private readonly imageGenerator: ImageGenerator,
  ) {}

  async execute(input: GenerateImageFromVoiceInput): Promise<Conversation> {
    const conversation = await this.loadOrStart(input.conversationId);

    const prompt = await this.transcriber.transcribe(input.audio);
    conversation.recordUserMessage(prompt, Modality.voice());
    await this.conversations.save(conversation);

    const image = await this.imageGenerator.generate(prompt);
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
