import { inject, injectable } from "inversify";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import type { AiProvider, ReplyChunkListener } from "../ports/ai-provider";
import type { ConversationRepository } from "../ports/conversation-repository";
import { TYPES } from "../tokens";

export type BeginConversationInput = {
  content: string;
  modality: Modality;
};

@injectable()
export class BeginConversation {
  constructor(
    @inject(TYPES.ConversationRepository)
    private readonly conversations: ConversationRepository,
    @inject(TYPES.AiProvider)
    private readonly ai: AiProvider,
  ) {}

  async execute(
    input: BeginConversationInput,
    onChunk: ReplyChunkListener,
    onStarted: (conversationId: string) => void,
  ): Promise<void> {
    const conversation = Conversation.start();
    conversation.recordUserMessage(input.content, input.modality);
    await this.conversations.save(conversation);
    onStarted(conversation.id);

    let assembledReply = "";
    await this.ai.streamReply(
      conversation.history(),
      (chunk) => {
        assembledReply += chunk;
        onChunk(chunk);
      },
      conversation.instructionText(),
    );

    conversation.recordAssistantReply(assembledReply, Modality.text());
    await this.conversations.save(conversation);
  }
}
