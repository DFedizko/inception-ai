import type { HttpClient } from "@/features/shared/http/http-client";

import type { Conversation } from "../../model/conversation.model";
import type { ConversationSummary } from "../../model/conversation-summary.model";
import { UUID } from "@/features/shared/value-objects/uuid";

import { Message, type Content, type Role, type Type } from "../../model/message.model";
import type { RecordedAudio } from "../audio/voice-recorder.ports";
import type {
  AssistantReplyChunk,
  ConversationGateway,
  LiveToken,
  ReplyChunkConsumer,
  TurnInput,
} from "./conversation.gateway";

type ConversationSummaryDTO = { id: string; title: string; createdAt: string };

type MessageDTO = {
  id: string;
  role: Role;
  type: Type;
  content: string;
  contents?: Content[];
  createdAt: string;
};

type ConversationDTO = {
  id: string;
  title: string;
  createdAt: string;
  instruction: string | null;
  messages: MessageDTO[];
};

type LiveTokenDTO = { token: string; expiresAt: string; model: string };

export class HttpConversationGateway implements ConversationGateway {
  private readonly path = "/api/conversations";
  private readonly tokenPath = "/api/live/token";

  constructor(private readonly http: HttpClient) {}

  async listConversations(): Promise<ConversationSummary[]> {
    const { conversations } = await this.http.get<{
      conversations: ConversationSummaryDTO[];
    }>(this.path);
    return conversations.map((dto) => this.toSummary(dto));
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.toConversation(await this.http.get<ConversationDTO>(`${this.path}/${id}`));
  }

  async beginConversation(
    content: string,
    onConversationId: (conversationId: string) => void,
    onReply: ReplyChunkConsumer,
  ): Promise<void> {
    const state = { buffer: "" };
    await this.http.stream(
      this.path,
      {
        method: "POST",
        body: { content, type: "text" satisfies Type },
        onResponse: (response) => {
          const id = response.headers.get("x-conversation-id");
          if (id) onConversationId(id);
        },
      },
      (fragment) => this.absorb(state, fragment, onReply),
    );
    this.flush(state, onReply);
  }

  async beginConversationWithTurns(turns: TurnInput[]): Promise<Conversation> {
    return this.toConversation(
      await this.http.post<ConversationDTO>(`${this.path}/turns`, { turns }),
    );
  }

  async streamAssistantReply(
    conversationId: string,
    content: string,
    onReply: ReplyChunkConsumer,
  ): Promise<void> {
    const state = { buffer: "" };
    await this.http.stream(
      `${this.path}/${conversationId}/messages`,
      {
        method: "POST",
        body: { content, type: "text" satisfies Type },
      },
      (fragment) => this.absorb(state, fragment, onReply),
    );
    this.flush(state, onReply);
  }

  private absorb(state: { buffer: string }, fragment: string, onReply: ReplyChunkConsumer): void {
    const lines = (state.buffer + fragment).split("\n");
    state.buffer = lines.pop() ?? "";
    lines.forEach((line) => this.emitLine(line, onReply));
  }

  private flush(state: { buffer: string }, onReply: ReplyChunkConsumer): void {
    this.emitLine(state.buffer, onReply);
  }

  private emitLine(line: string, onReply: ReplyChunkConsumer): void {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    onReply(JSON.parse(trimmed) as AssistantReplyChunk);
  }

  async issueLiveToken(instruction?: string | null): Promise<LiveToken> {
    const dto = await this.http.post<LiveTokenDTO>(this.tokenPath, { instruction: instruction ?? null });
    return { token: dto.token, expiresAt: dto.expiresAt, model: dto.model };
  }

  async recordTurns(conversationId: string, turns: TurnInput[]): Promise<Conversation> {
    return this.toConversation(
      await this.http.post<ConversationDTO>(`${this.path}/${conversationId}/turns`, { turns }),
    );
  }

  async instructAgent(conversationId: string, instruction: string): Promise<Conversation> {
    return this.toConversation(
      await this.http.put<ConversationDTO>(`${this.path}/${conversationId}/agent`, { instruction }),
    );
  }

  async generateImage(conversationId: string | null, prompt: string): Promise<Conversation> {
    const path = conversationId ? `${this.path}/${conversationId}/images` : `${this.path}/images`;
    return this.toConversation(
      await this.http.post<ConversationDTO>(path, { prompt, type: "text" satisfies Type }),
    );
  }

  async generateImageFromVoice(
    conversationId: string | null,
    audio: RecordedAudio,
  ): Promise<Conversation> {
    const path = conversationId
      ? `${this.path}/${conversationId}/images/voice`
      : `${this.path}/images/voice`;
    return this.toConversation(
      await this.http.post<ConversationDTO>(path, {
        audio: audio.data,
        mimeType: audio.mimeType,
      }),
    );
  }

  async generateVideo(conversationId: string | null, prompt: string): Promise<Conversation> {
    const path = conversationId ? `${this.path}/${conversationId}/videos` : `${this.path}/videos`;
    return this.toConversation(
      await this.http.post<ConversationDTO>(path, {
        prompt,
        type: "text" satisfies Type,
      }),
    );
  }

  private toSummary(dto: ConversationSummaryDTO): ConversationSummary {
    return { id: UUID.create(dto.id), title: dto.title, createdAt: dto.createdAt };
  }

  private toConversation(dto: ConversationDTO): Conversation {
    return {
      id: UUID.create(dto.id),
      title: dto.title,
      createdAt: dto.createdAt,
      instruction: dto.instruction,
      messages: dto.messages.map((message) => this.toMessage(message)),
    };
  }

  private toMessage(dto: MessageDTO): Message {
    return new Message(
      UUID.create(dto.id),
      dto.role,
      dto.type,
      dto.content,
      dto.createdAt,
      dto.contents ?? [],
    );
  }
}
