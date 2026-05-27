import type { Role, Type } from "../../../model/message.model";

const at = "2026-05-26T10:00:00.000Z";

export const conversationId = "11111111-1111-4111-8111-111111111111";

type MessageDto = { id: string; role: Role; type: Type; content: string; createdAt: string };

export const userMessageDto: MessageDto = {
  id: "33333333-3333-4333-8333-333333333333",
  role: "user",
  type: "text",
  content: "Oi",
  createdAt: at,
};

export const assistantMessageDto: MessageDto = {
  id: "44444444-4444-4444-8444-444444444444",
  role: "assistant",
  type: "text",
  content: "Olá! Como posso ajudar?",
  createdAt: at,
};

export const conversationResponse = {
  id: conversationId,
  title: "Sobre TDD",
  createdAt: at,
  instruction: null as string | null,
  messages: [userMessageDto, assistantMessageDto],
};

export const instructedConversationResponse = {
  ...conversationResponse,
  instruction: "Você é o Toby, um médico",
};
