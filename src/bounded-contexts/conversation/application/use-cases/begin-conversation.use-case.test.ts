import { describe, expect, it } from "bun:test";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { FakeAiProvider } from "../../infrastructure/ai/ai-provider.fake";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { BeginConversation } from "./begin-conversation.use-case";

describe("BeginConversation", () => {
  it("creates the conversation with its first message and persists both turns", async () => {
    const repository = new InMemoryConversationRepository();
    const ai = new FakeAiProvider({ chunks: ["Paris", " is the capital."] });
    let assembled = "";
    let startedId = "";

    await new BeginConversation(repository, ai).execute(
      { content: "Capital of France?", modality: Modality.text() },
      (chunk) => (assembled += chunk),
      (id) => (startedId = id),
    );

    expect(assembled).toBe("Paris is the capital.");
    expect(startedId).not.toBe("");
    const persisted = await repository.findById(startedId);
    expect(persisted?.messages.map((message) => message.text())).toEqual([
      "Capital of France?",
      "Paris is the capital.",
    ]);
  });

  it("announces the new id before streaming, and derives the title from the first message", async () => {
    const repository = new InMemoryConversationRepository();
    const announced: string[] = [];

    await new BeginConversation(repository, new FakeAiProvider()).execute(
      { content: "Teach me about photosynthesis", modality: Modality.text() },
      () => {},
      (id) => announced.push(id),
    );

    expect(announced).toHaveLength(1);
    const persisted = await repository.findById(announced[0]);
    expect(persisted?.title.toString()).toBe("Teach me about photosynthesis");
  });

  it("persists a conversation that already carries its first message (never empty)", async () => {
    const repository = new InMemoryConversationRepository();
    let startedId = "";
    await new BeginConversation(repository, new FakeAiProvider()).execute(
      { content: "Oi", modality: Modality.text() },
      () => {},
      (id) => (startedId = id),
    );

    const persisted = await repository.findById(startedId);
    expect(persisted?.isEmpty()).toBe(false);
  });
});
