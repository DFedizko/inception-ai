import { inject, injectable } from "inversify";
import type {
  ConversationSummaries,
  ConversationSummary,
} from "../ports/conversation-summaries";
import { TYPES } from "../tokens";

@injectable()
export class ListConversations {
  constructor(
    @inject(TYPES.ConversationSummaries)
    private readonly summaries: ConversationSummaries,
  ) {}

  execute(): Promise<ConversationSummary[]> {
    return this.summaries.listNewestFirst();
  }
}
