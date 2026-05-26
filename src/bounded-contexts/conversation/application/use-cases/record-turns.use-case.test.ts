import { describe, expect, it } from "bun:test";
import { Conversation, TurnOrderError } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { RecordTurns } from "./record-turns.use-case";

const setup = async () => {
  const repository = new InMemoryConversationRepository();
  const conversation = Conversation.start();
  await repository.save(conversation);
  return { repository, conversationId: conversation.id };
};

describe("RecordTurns", () => {
  it("appends a user/assistant voice pair and returns the conversation", async () => {
    const { repository, conversationId } = await setup();

    const conversation = await new RecordTurns(repository).execute({
      conversationId,
      turns: [
        { role: "user", modality: Modality.voice(), content: "How is the weather?" },
        { role: "assistant", modality: Modality.voice(), content: "Sunny today." },
      ],
    });

    expect(conversation.messages.map((m) => m.text())).toEqual([
      "How is the weather?",
      "Sunny today.",
    ]);
    expect(conversation.messages[0]?.modality.isVoice()).toBe(true);
  });

  it("derives the Title from the first user message", async () => {
    const { repository, conversationId } = await setup();

    const conversation = await new RecordTurns(repository).execute({
      conversationId,
      turns: [{ role: "user", modality: Modality.voice(), content: "Tell me about Saturn" }],
    });

    expect(conversation.title.toString()).toBe("Tell me about Saturn");
  });

  it("persists per call so a later call appends to stored turns", async () => {
    const { repository, conversationId } = await setup();
    const useCase = new RecordTurns(repository);

    await useCase.execute({
      conversationId,
      turns: [
        { role: "user", modality: Modality.voice(), content: "First" },
        { role: "assistant", modality: Modality.voice(), content: "Reply one" },
      ],
    });
    const conversation = await useCase.execute({
      conversationId,
      turns: [
        { role: "user", modality: Modality.voice(), content: "Second" },
        { role: "assistant", modality: Modality.voice(), content: "Reply two" },
      ],
    });

    expect(conversation.messages).toHaveLength(4);
  });

  it("rejects an unknown conversation", async () => {
    const { repository } = await setup();

    await expect(
      new RecordTurns(repository).execute({
        conversationId: "missing",
        turns: [{ role: "user", modality: Modality.voice(), content: "Hi" }],
      }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("enforces the turn-order invariant", async () => {
    const { repository, conversationId } = await setup();

    await expect(
      new RecordTurns(repository).execute({
        conversationId,
        turns: [{ role: "assistant", modality: Modality.voice(), content: "I cannot lead." }],
      }),
    ).rejects.toBeInstanceOf(TurnOrderError);
  });
});
