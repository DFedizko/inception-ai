export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: Date;
};

export interface ConversationSummaries {
  listNewestFirst(): Promise<ConversationSummary[]>;
}
