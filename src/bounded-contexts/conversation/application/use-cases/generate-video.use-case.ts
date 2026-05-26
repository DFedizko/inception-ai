import { inject, injectable } from "inversify";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { GeneratedVideo } from "../../domain/entities/generated-video.entity";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import type { ConversationRepository } from "../ports/conversation-repository";
import type { VideoGenerator } from "../ports/video-generator";
import { TYPES } from "../tokens";

export type GenerateVideoInput = {
  conversationId?: string;
  prompt: string;
  modality: Modality;
};

@injectable()
export class GenerateVideo {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
    @inject(TYPES.VideoGenerator)
    private readonly videoGenerator: VideoGenerator,
  ) {}

  async execute(input: GenerateVideoInput): Promise<Conversation> {
    const conversation = await this.loadOrStart(input.conversationId);

    conversation.recordUserMessage(input.prompt, input.modality);
    const video = GeneratedVideo.requested(input.prompt);
    conversation.recordAssistantContent(Modality.text(), [video]);
    await this.conversations.save(conversation);

    video.startGenerating();
    const outcome = await this.videoGenerator.generate(input.prompt);
    if (outcome.status === "ready") {
      video.markReady(outcome.uri);
    } else {
      video.markFailed(outcome.reason);
    }
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
