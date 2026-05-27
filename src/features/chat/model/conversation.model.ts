import type { UUID } from "@/features/shared/value-objects/uuid";

import type { Message } from "./message.model";

export type Conversation = {
  id: UUID;
  title: string;
  createdAt: string;
  instruction: string | null;
  messages: Message[];
};
