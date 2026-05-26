import type { Message } from "./message.model";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  instruction: string | null;
  messages: Message[];
};
