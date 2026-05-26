import { describe, expect, it } from "bun:test";
import { GeneratedVideo } from "../../domain/entities/generated-video.entity";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { FakeVideoGenerator } from "../../infrastructure/ai/video-generator.fake";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { GenerateVideo } from "./generate-video.use-case";

const setup = async () => {
  const repository = new InMemoryConversationRepository();
  const conversation = Conversation.start();
  await repository.save(conversation);
  return { repository, conversationId: conversation.id };
};

describe("GenerateVideo", () => {
  it("records a pending video request that is driven to ready with a uri", async () => {
    const { repository, conversationId } = await setup();
    const generator = new FakeVideoGenerator({ outcome: { status: "ready", uri: "blob://beach.mp4" } });

    const conversation = await new GenerateVideo(repository, generator).execute({
      conversationId,
      prompt: "a beach at sunset",
      modality: Modality.text(),
    });

    expect(generator.receivedPrompt).toBe("a beach at sunset");
    const video = conversation.messages[1]?.contents[0] as GeneratedVideo;
    expect(video.status.isReady()).toBe(true);
    expect(video.uri).toBe("blob://beach.mp4");

    const persisted = await repository.findById(conversationId);
    const [, assistantTurn] = persisted?.messages ?? [];
    const [content] = assistantTurn?.contents ?? [];
    expect(content).toBeInstanceOf(GeneratedVideo);
    expect((content as GeneratedVideo).status.isReady()).toBe(true);
  });

  it("marks the video failed, keeping the reason, when the provider reports a failure", async () => {
    const { repository, conversationId } = await setup();
    const generator = new FakeVideoGenerator({
      outcome: { status: "failed", reason: "quota exceeded" },
    });

    const conversation = await new GenerateVideo(repository, generator).execute({
      conversationId,
      prompt: "a beach",
      modality: Modality.text(),
    });

    const video = conversation.messages[1]?.contents[0] as GeneratedVideo;
    expect(video.status.isFailed()).toBe(true);
    expect(video.failureReason).toBe("quota exceeded");
  });

  it("throws when the conversation is unknown", async () => {
    const generate = new GenerateVideo(new InMemoryConversationRepository(), new FakeVideoGenerator());

    await expect(
      generate.execute({ conversationId: "missing", prompt: "a beach", modality: Modality.text() }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("begins a new conversation when no conversationId is given", async () => {
    const repository = new InMemoryConversationRepository();
    const generator = new FakeVideoGenerator({ outcome: { status: "ready", uri: "blob://v.mp4" } });

    const conversation = await new GenerateVideo(repository, generator).execute({
      prompt: "a beach",
      modality: Modality.text(),
    });

    expect(conversation.messages).toHaveLength(2);
    const persisted = await repository.findById(conversation.id);
    expect(persisted?.messages).toHaveLength(2);
  });
});
