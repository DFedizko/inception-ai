import type { UUID } from "@/features/shared/value-objects/uuid";

export type ConversationSummary = {
  id: UUID;
  title: string;
  createdAt: string;
};
