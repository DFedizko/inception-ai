import { describe, expect, it } from "bun:test";
import { GeneratedVideo } from "../entities/generated-video.entity";
import { ImageContent } from "../value-objects/image-content.value-object";
import { Modality } from "../value-objects/modality.value-object";
import { Conversation, TurnOrderError } from "./conversation.aggregate";

describe("Conversation", () => {
  it("starts empty with a placeholder title", () => {
    const conversation = Conversation.start();

    expect(conversation.isEmpty()).toBe(true);
    expect(conversation.title.isPlaceholder()).toBe(true);
    expect(conversation.messages).toHaveLength(0);
  });

  it("derives its title from the first user message", () => {
    const conversation = Conversation.start();

    conversation.recordUserMessage("What is the capital of France?", Modality.text());

    expect(conversation.title.toString()).toBe("What is the capital of France?");
    expect(conversation.messages).toHaveLength(1);
  });

  it("keeps the first title when later user messages arrive", () => {
    const conversation = Conversation.start();

    conversation.recordUserMessage("First question", Modality.text());
    conversation.recordAssistantReply("First answer", Modality.text());
    conversation.recordUserMessage("Second question", Modality.text());

    expect(conversation.title.toString()).toBe("First question");
  });

  it("alternates turns: rejects two consecutive user messages", () => {
    const conversation = Conversation.start();

    conversation.recordUserMessage("Hello", Modality.text());

    expect(() => conversation.recordUserMessage("Are you there?", Modality.text())).toThrow(
      TurnOrderError,
    );
  });

  it("rejects an assistant reply without a pending user message", () => {
    const conversation = Conversation.start();

    expect(() => conversation.recordAssistantReply("Hi", Modality.text())).toThrow(TurnOrderError);
  });

  it("rejects two consecutive assistant replies", () => {
    const conversation = Conversation.start();
    conversation.recordUserMessage("Hello", Modality.text());
    conversation.recordAssistantReply("Hi", Modality.text());

    expect(() => conversation.recordAssistantReply("Again", Modality.text())).toThrow(TurnOrderError);
  });

  it("records an assistant image generated from a user request", () => {
    const conversation = Conversation.start();
    conversation.recordUserMessage("Draw a cat", Modality.text());

    const message = conversation.recordAssistantContent(Modality.text(), [
      ImageContent.of({ uri: "blob://cat.png", mimeType: "image/png", width: 1024, height: 1024 }),
    ]);

    expect(message.contents.map((content) => content.kind)).toEqual(["image"]);
    expect(conversation.messages).toHaveLength(2);
  });

  it("records an assistant video that derives from the conversation and carries its lifecycle", () => {
    const conversation = Conversation.start();
    conversation.recordUserMessage("Make a beach video", Modality.text());

    const video = GeneratedVideo.requested("a beach at sunset");
    conversation.recordAssistantContent(Modality.text(), [video]);
    video.startGenerating();
    video.markReady("blob://beach.mp4");

    const [, assistantTurn] = conversation.messages;
    const [recordedVideo] = assistantTurn.contents;
    expect(recordedVideo).toBeInstanceOf(GeneratedVideo);
    expect((recordedVideo as GeneratedVideo).status.isReady()).toBe(true);
  });

  it("rejects a generated artifact without a pending user message", () => {
    const conversation = Conversation.start();

    expect(() =>
      conversation.recordAssistantContent(Modality.text(), [GeneratedVideo.requested("x")]),
    ).toThrow(TurnOrderError);
  });

  it("exposes its history as ordered text turns for the AI provider", () => {
    const conversation = Conversation.start();
    conversation.recordUserMessage("Hello", Modality.text());
    conversation.recordAssistantReply("Hi", Modality.text());

    expect(conversation.history()).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ]);
  });
});
