import { describe, expect, it } from "bun:test";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { BeginConversationWithTurns } from "./begin-conversation-with-turns.use-case";

describe("BeginConversationWithTurns", () => {
  it("creates a conversation from the first voice turns and persists it", async () => {
    const repository = new InMemoryConversationRepository();

    const conversation = await new BeginConversationWithTurns(repository).execute({
      turns: [
        { role: "user", modality: Modality.voice(), content: "Olá assistente" },
        { role: "assistant", modality: Modality.voice(), content: "Olá, como vai?" },
      ],
    });

    const persisted = await repository.findById(conversation.id);
    expect(persisted?.messages.map((message) => message.text())).toEqual([
      "Olá assistente",
      "Olá, como vai?",
    ]);
    expect(persisted?.title.toString()).toBe("Olá assistente");
  });
});
