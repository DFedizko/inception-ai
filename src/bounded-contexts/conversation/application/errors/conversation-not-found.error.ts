export class ConversationNotFoundError extends Error {
  constructor(readonly conversationId: string) {
    super(`Conversation "${conversationId}" was not found.`);
    this.name = "ConversationNotFoundError";
  }
}
