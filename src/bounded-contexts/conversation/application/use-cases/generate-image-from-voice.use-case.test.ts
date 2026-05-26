import { describe, expect, it } from "bun:test";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { FakeImageGenerator } from "../../infrastructure/ai/image-generator.fake";
import { FakeTranscriber } from "../../infrastructure/ai/transcriber.fake";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { GenerateImageFromVoice } from "./generate-image-from-voice.use-case";

const setup = async () => {
  const repository = new InMemoryConversationRepository();
  const conversation = Conversation.start();
  await repository.save(conversation);
  return { repository, conversationId: conversation.id };
};

const audio = { data: new Uint8Array([1, 2, 3]), mimeType: "audio/webm" };

describe("GenerateImageFromVoice", () => {
  it("transcribes the audio, records the voice prompt and the generated image", async () => {
    const { repository, conversationId } = await setup();
    const transcriber = new FakeTranscriber({ transcript: "um gato astronauta" });
    const imageGenerator = new FakeImageGenerator();

    const conversation = await new GenerateImageFromVoice(
      repository,
      transcriber,
      imageGenerator,
    ).execute({ conversationId, audio });

    expect(transcriber.receivedAudio?.mimeType).toBe("audio/webm");
    expect(imageGenerator.receivedPrompt).toBe("um gato astronauta");
    expect(conversation.messages[0]?.text()).toBe("um gato astronauta");
    expect(conversation.messages[0]?.modality.isVoice()).toBe(true);
    expect(conversation.messages[1]?.contents.map((content) => content.kind)).toEqual(["image"]);
  });

  it("throws when the conversation is unknown", async () => {
    const generate = new GenerateImageFromVoice(
      new InMemoryConversationRepository(),
      new FakeTranscriber(),
      new FakeImageGenerator(),
    );

    await expect(generate.execute({ conversationId: "missing", audio })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });

  it("begins a new conversation when no conversationId is given", async () => {
    const repository = new InMemoryConversationRepository();

    const conversation = await new GenerateImageFromVoice(
      repository,
      new FakeTranscriber({ transcript: "um gato" }),
      new FakeImageGenerator(),
    ).execute({ audio });

    expect(conversation.messages[0]?.text()).toBe("um gato");
    expect(conversation.messages[1]?.contents.map((content) => content.kind)).toEqual(["image"]);
    const persisted = await repository.findById(conversation.id);
    expect(persisted?.messages).toHaveLength(2);
  });
});
