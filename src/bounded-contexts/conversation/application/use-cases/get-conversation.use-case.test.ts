import { describe, expect, it } from "bun:test";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { GetConversation } from "./get-conversation.use-case";

describe("GetConversation", () => {
  it("returns the conversation when it exists", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);

    const found = await new GetConversation(repository).execute(conversation.id);

    expect(found.id).toBe(conversation.id);
  });

  it("throws when the conversation is unknown", async () => {
    const getConversation = new GetConversation(new InMemoryConversationRepository());

    await expect(getConversation.execute("missing")).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });
});
