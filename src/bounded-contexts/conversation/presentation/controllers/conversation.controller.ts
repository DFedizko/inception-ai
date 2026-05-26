import { inject, injectable } from "inversify";
import { ValidationError } from "../../../shared/errors/validation.error";
import { Modality } from "../../domain/value-objects/modality.value-object";
import type { ReplyChunkListener } from "../../application/ports/ai-provider";
import { BeginConversation } from "../../application/use-cases/begin-conversation.use-case";
import { BeginConversationWithTurns } from "../../application/use-cases/begin-conversation-with-turns.use-case";
import { GenerateImage } from "../../application/use-cases/generate-image.use-case";
import { GenerateImageFromVoice } from "../../application/use-cases/generate-image-from-voice.use-case";
import { GenerateVideo } from "../../application/use-cases/generate-video.use-case";
import { GetConversation } from "../../application/use-cases/get-conversation.use-case";
import { InstructAgent } from "../../application/use-cases/instruct-agent.use-case";
import { IssueLiveToken } from "../../application/use-cases/issue-live-token.use-case";
import { ListConversations } from "../../application/use-cases/list-conversations.use-case";
import { RecordTurns } from "../../application/use-cases/record-turns.use-case";
import { SendMessage } from "../../application/use-cases/send-message.use-case";
import type { ConversationDTO, ConversationListDTO } from "../dto/conversation.dto";
import type { LiveTokenDTO } from "../dto/live-token.dto";
import { generateImageBodySchema } from "../dto/generate-image.dto";
import { generateImageFromVoiceBodySchema } from "../dto/generate-image-from-voice.dto";
import { generateVideoBodySchema } from "../dto/generate-video.dto";
import { instructAgentBodySchema } from "../dto/instruct-agent.dto";
import { recordTurnsBodySchema } from "../dto/record-turns.dto";
import { sendMessageBodySchema } from "../dto/send-message.dto";
import { toConversationDTO, toConversationSummaryDTO } from "../mappers/conversation.mapper";

@injectable()
export class ConversationController {
  constructor(
    @inject(BeginConversation) private readonly beginConversationUseCase: BeginConversation,
    @inject(BeginConversationWithTurns)
    private readonly beginConversationWithTurnsUseCase: BeginConversationWithTurns,
    @inject(ListConversations) private readonly listConversationsUseCase: ListConversations,
    @inject(GetConversation) private readonly getConversationUseCase: GetConversation,
    @inject(SendMessage) private readonly sendMessageUseCase: SendMessage,
    @inject(IssueLiveToken) private readonly issueLiveTokenUseCase: IssueLiveToken,
    @inject(RecordTurns) private readonly recordTurnsUseCase: RecordTurns,
    @inject(InstructAgent) private readonly instructAgentUseCase: InstructAgent,
    @inject(GenerateImage) private readonly generateImageUseCase: GenerateImage,
    @inject(GenerateImageFromVoice)
    private readonly generateImageFromVoiceUseCase: GenerateImageFromVoice,
    @inject(GenerateVideo) private readonly generateVideoUseCase: GenerateVideo,
  ) {}

  async beginConversation(
    rawBody: unknown,
    onChunk: ReplyChunkListener,
    onStarted: (conversationId: string) => void,
  ): Promise<void> {
    const parsed = sendMessageBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    await this.beginConversationUseCase.execute(
      { content: parsed.data.content, modality: Modality.fromString(parsed.data.type) },
      onChunk,
      onStarted,
    );
  }

  async beginConversationWithTurns(rawBody: unknown): Promise<ConversationDTO> {
    const parsed = recordTurnsBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    const conversation = await this.beginConversationWithTurnsUseCase.execute({
      turns: parsed.data.turns.map((turn) => ({
        role: turn.role,
        modality: Modality.fromString(turn.type),
        content: turn.content,
      })),
    });

    return toConversationDTO(conversation);
  }

  async listConversations(): Promise<ConversationListDTO> {
    const summaries = await this.listConversationsUseCase.execute();
    return { conversations: summaries.map(toConversationSummaryDTO) };
  }

  async getConversation(id: string): Promise<ConversationDTO> {
    return toConversationDTO(await this.getConversationUseCase.execute(id));
  }

  async sendMessage(
    conversationId: string,
    rawBody: unknown,
    onChunk: ReplyChunkListener,
  ): Promise<void> {
    const parsed = sendMessageBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    await this.sendMessageUseCase.execute(
      { conversationId, content: parsed.data.content, modality: Modality.fromString(parsed.data.type) },
      onChunk,
    );
  }

  async instructAgent(conversationId: string, rawBody: unknown): Promise<ConversationDTO> {
    const parsed = instructAgentBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    const conversation = await this.instructAgentUseCase.execute({
      conversationId,
      instruction: parsed.data.instruction,
    });

    return toConversationDTO(conversation);
  }

  async issueLiveToken(): Promise<LiveTokenDTO> {
    const token = await this.issueLiveTokenUseCase.execute();
    return { token: token.token, expiresAt: token.expiresAt, model: token.model };
  }

  async recordTurns(conversationId: string, rawBody: unknown): Promise<ConversationDTO> {
    const parsed = recordTurnsBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    const conversation = await this.recordTurnsUseCase.execute({
      conversationId,
      turns: parsed.data.turns.map((turn) => ({
        role: turn.role,
        modality: Modality.fromString(turn.type),
        content: turn.content,
      })),
    });

    return toConversationDTO(conversation);
  }

  async generateImage(
    conversationId: string | undefined,
    rawBody: unknown,
  ): Promise<ConversationDTO> {
    const parsed = generateImageBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    const conversation = await this.generateImageUseCase.execute({
      conversationId,
      prompt: parsed.data.prompt,
      modality: Modality.fromString(parsed.data.type),
    });

    return toConversationDTO(conversation);
  }

  async generateVideo(
    conversationId: string | undefined,
    rawBody: unknown,
  ): Promise<ConversationDTO> {
    const parsed = generateVideoBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    const conversation = await this.generateVideoUseCase.execute({
      conversationId,
      prompt: parsed.data.prompt,
      modality: Modality.fromString(parsed.data.type),
    });

    return toConversationDTO(conversation);
  }

  async generateImageFromVoice(
    conversationId: string | undefined,
    rawBody: unknown,
  ): Promise<ConversationDTO> {
    const parsed = generateImageFromVoiceBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw this.toValidationError(parsed.error);
    }

    const conversation = await this.generateImageFromVoiceUseCase.execute({
      conversationId,
      audio: {
        data: Buffer.from(parsed.data.audio, "base64"),
        mimeType: parsed.data.mimeType,
      },
    });

    return toConversationDTO(conversation);
  }

  private toValidationError(error: { issues: { path: PropertyKey[]; message: string }[] }): ValidationError {
    return new ValidationError(
      error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    );
  }
}
