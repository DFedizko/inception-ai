import { describe, expect, it } from "bun:test";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Title } from "../../domain/value-objects/title.value-object";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ListConversations } from "./list-conversations.use-case";

describe("ListConversations", () => {
  it("returns summaries newest first", async () => {
    const repository = new InMemoryConversationRepository();
    await repository.save(
      Conversation.reconstitute({
        id: "older",
        title: Title.of("Older"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        messages: [],
      }),
    );
    await repository.save(
      Conversation.reconstitute({
        id: "newer",
        title: Title.of("Newer"),
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        messages: [],
      }),
    );

    const summaries = await new ListConversations(repository).execute();

    expect(summaries.map((summary) => summary.id)).toEqual(["newer", "older"]);
  });

  it("returns an empty list when there are no conversations", async () => {
    const summaries = await new ListConversations(new InMemoryConversationRepository()).execute();

    expect(summaries).toEqual([]);
  });
});
