import type { Conversation } from "../../model/conversation.model";
import type { ConversationSummary } from "../../model/conversation-summary.model";
import type { Role, Type } from "../../model/message.model";
import type { RecordedAudio } from "../audio/voice-recorder.ports";

export type AssistantReplyChunk = string;

export type LiveToken = { token: string; expiresAt: string; model: string };

export type TurnInput = { role: Role; type: Type; content: string };

export interface ConversationGateway {
  listConversations(): Promise<ConversationSummary[]>;
  getConversation(id: string): Promise<Conversation>;
  beginConversation(
    content: string,
    onConversationId: (conversationId: string) => void,
  ): AsyncIterable<AssistantReplyChunk>;
  beginConversationWithTurns(turns: TurnInput[]): Promise<Conversation>;
  streamAssistantReply(
    conversationId: string,
    content: string,
  ): AsyncIterable<AssistantReplyChunk>;
  issueLiveToken(): Promise<LiveToken>;
  recordTurns(conversationId: string, turns: TurnInput[]): Promise<Conversation>;
  instructAgent(conversationId: string, instruction: string): Promise<Conversation>;
  generateImage(conversationId: string | null, prompt: string): Promise<Conversation>;
  generateImageFromVoice(
    conversationId: string | null,
    audio: RecordedAudio,
  ): Promise<Conversation>;
  generateVideo(conversationId: string | null, prompt: string): Promise<Conversation>;
}
