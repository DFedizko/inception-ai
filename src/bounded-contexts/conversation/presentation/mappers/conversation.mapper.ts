import type { Conversation } from "../../domain/aggregates/conversation.aggregate";
import type { Message } from "../../domain/entities/message.entity";
import type { Content } from "../../domain/value-objects/content";
import type { ConversationSummary } from "../../application/ports/conversation-summaries";
import type {
  ContentDTO,
  ConversationDTO,
  ConversationSummaryDTO,
  MessageDTO,
} from "../dto/conversation.dto";

export const toMessageDTO = (message: Message): MessageDTO => ({
  id: message.id,
  role: message.role.toString(),
  type: message.modality.toString(),
  content: message.text(),
  contents: message.contents.map(toContentDTO),
  createdAt: message.createdAt.toISOString(),
});

const toContentDTO = (content: Content): ContentDTO => {
  switch (content.kind) {
    case "text":
      return { kind: "text", text: content.toString() };
    case "audio":
      return {
        kind: "audio",
        uri: content.uri,
        mimeType: content.mimeType,
        durationMs: content.durationMs,
      };
    case "image":
      return {
        kind: "image",
        uri: content.uri,
        mimeType: content.mimeType,
        width: content.width,
        height: content.height,
      };
    case "video":
      return {
        kind: "video",
        status: content.status.toString(),
        prompt: content.prompt,
        uri: content.uri ?? null,
        failureReason: content.failureReason ?? null,
      };
  }
};

export const toConversationDTO = (conversation: Conversation): ConversationDTO => ({
  id: conversation.id,
  title: conversation.title.toString(),
  createdAt: conversation.createdAt.toISOString(),
  instruction: conversation.instructionText(),
  messages: conversation.messages.map(toMessageDTO),
});

export const toConversationSummaryDTO = (summary: ConversationSummary): ConversationSummaryDTO => ({
  id: summary.id,
  title: summary.title,
  createdAt: summary.createdAt.toISOString(),
});
