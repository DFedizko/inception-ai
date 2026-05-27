const at = "2026-05-26T10:00:00.000Z";

type ConversationSummaryDto = { id: string; title: string; createdAt: string };

export const conversationSummaryDto: ConversationSummaryDto = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Sobre TDD",
  createdAt: at,
};

export const otherConversationSummaryDto: ConversationSummaryDto = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Sobre DDD",
  createdAt: at,
};

export const conversationsResponse: { conversations: ConversationSummaryDto[] } = {
  conversations: [conversationSummaryDto, otherConversationSummaryDto],
};
