import { describe, expect, it } from "bun:test";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { FakeAiProvider } from "../../infrastructure/ai/ai-provider.fake";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { SendMessage } from "./send-message.use-case";

const collectChunks = (): { onChunk: (chunk: string) => void; assembled: () => string } => {
  let assembled = "";
  return { onChunk: (chunk) => (assembled += chunk), assembled: () => assembled };
};

describe("SendMessage", () => {
  it("streams the assistant reply and persists both turns", async () => {
    const repository = new InMemoryConversationRepository();
    const ai = new FakeAiProvider({ chunks: ["Paris", " is the capital."] });
    const conversation = Conversation.start();
    await repository.save(conversation);
    const sink = collectChunks();

    await new SendMessage(repository, ai).execute(
      { conversationId: conversation.id, content: "Capital of France?", modality: Modality.text() },
      sink.onChunk,
    );

    expect(sink.assembled()).toBe("Paris is the capital.");
    const persisted = await repository.findById(conversation.id);
    expect(persisted?.messages.map((message) => message.text())).toEqual([
      "Capital of France?",
      "Paris is the capital.",
    ]);
  });

  it("derives the title from the first user message", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);

    await new SendMessage(repository, new FakeAiProvider()).execute(
      { conversationId: conversation.id, content: "Teach me about photosynthesis", modality: Modality.text() },
      () => {},
    );

    const persisted = await repository.findById(conversation.id);
    expect(persisted?.title.toString()).toBe("Teach me about photosynthesis");
  });

  it("forwards the conversation history (incl. the new user turn) to the provider", async () => {
    const repository = new InMemoryConversationRepository();
    const ai = new FakeAiProvider();
    const conversation = Conversation.start();
    await repository.save(conversation);

    await new SendMessage(repository, ai).execute(
      { conversationId: conversation.id, content: "Hello", modality: Modality.text() },
      () => {},
    );

    expect(ai.receivedHistory).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("throws when the conversation is unknown", async () => {
    const sendMessage = new SendMessage(new InMemoryConversationRepository(), new FakeAiProvider());

    await expect(
      sendMessage.execute({ conversationId: "missing", content: "Hi", modality: Modality.text() }, () => {}),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("persists the user message but discards a partial reply on mid-stream failure", async () => {
    const repository = new InMemoryConversationRepository();
    const ai = new FakeAiProvider({ chunks: ["Half", " written"], failAfterChunk: 1 });
    const conversation = Conversation.start();
    await repository.save(conversation);

    await expect(
      new SendMessage(repository, ai).execute(
        { conversationId: conversation.id, content: "Hi", modality: Modality.text() },
        () => {},
      ),
    ).rejects.toThrow();

    const persisted = await repository.findById(conversation.id);
    expect(persisted?.messages).toHaveLength(1);
    expect(persisted?.messages[0]?.isFromUser()).toBe(true);
  });
});
