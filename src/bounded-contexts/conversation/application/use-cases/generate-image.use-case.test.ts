import { describe, expect, it } from "bun:test";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { FakeImageGenerator } from "../../infrastructure/ai/image-generator.fake";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { GenerateImage } from "./generate-image.use-case";

const setup = async () => {
  const repository = new InMemoryConversationRepository();
  const conversation = Conversation.start();
  await repository.save(conversation);
  return { repository, conversationId: conversation.id };
};

describe("GenerateImage", () => {
  it("records the user prompt and the assistant image, then persists both turns", async () => {
    const { repository, conversationId } = await setup();
    const generator = new FakeImageGenerator();

    const conversation = await new GenerateImage(repository, generator).execute({
      conversationId,
      prompt: "Draw a cat",
      modality: Modality.text(),
    });

    expect(generator.receivedPrompt).toBe("Draw a cat");
    expect(conversation.messages[1]?.contents.map((content) => content.kind)).toEqual(["image"]);

    const persisted = await repository.findById(conversationId);
    expect(persisted?.messages).toHaveLength(2);
    expect(persisted?.messages[0]?.text()).toBe("Draw a cat");
    expect(persisted?.messages[1]?.isFromAssistant()).toBe(true);
  });

  it("throws when the conversation is unknown", async () => {
    const generate = new GenerateImage(new InMemoryConversationRepository(), new FakeImageGenerator());

    await expect(
      generate.execute({ conversationId: "missing", prompt: "Draw a cat", modality: Modality.text() }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("persists the user prompt but records no assistant turn when generation fails", async () => {
    const { repository, conversationId } = await setup();
    const generator = new FakeImageGenerator({ failsWith: new Error("provider down") });

    await expect(
      new GenerateImage(repository, generator).execute({
        conversationId,
        prompt: "Draw a cat",
        modality: Modality.text(),
      }),
    ).rejects.toThrow("provider down");

    const persisted = await repository.findById(conversationId);
    expect(persisted?.messages).toHaveLength(1);
    expect(persisted?.messages[0]?.isFromUser()).toBe(true);
  });

  it("begins a new conversation when no conversationId is given", async () => {
    const repository = new InMemoryConversationRepository();

    const conversation = await new GenerateImage(repository, new FakeImageGenerator()).execute({
      prompt: "Draw a cat",
      modality: Modality.text(),
    });

    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[1]?.contents.map((content) => content.kind)).toEqual(["image"]);
    const persisted = await repository.findById(conversation.id);
    expect(persisted?.messages).toHaveLength(2);
  });
});
