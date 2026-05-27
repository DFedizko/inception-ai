import { describe, expect, it } from "bun:test";
import { ValidationError } from "../../../shared/errors/validation.error";
import { Conversation, TurnOrderError } from "../../domain/aggregates/conversation.aggregate";
import { ConversationNotFoundError } from "../../application/errors/conversation-not-found.error";
import { BeginConversation } from "../../application/use-cases/begin-conversation.use-case";
import { BeginConversationWithTurns } from "../../application/use-cases/begin-conversation-with-turns.use-case";
import { GenerateImage } from "../../application/use-cases/generate-image.use-case";
import { GenerateImageFromVoice } from "../../application/use-cases/generate-image-from-voice.use-case";
import { GenerateVideo } from "../../application/use-cases/generate-video.use-case";
import { GetConversation } from "../../application/use-cases/get-conversation.use-case";
import { InstructAgent } from "../../application/use-cases/instruct-agent.use-case";
import { IssueLiveToken } from "../../application/use-cases/issue-live-token.use-case";
import { ListConversations } from "../../application/use-cases/list-conversations.use-case";
import { RecordTurns } from "../../application/use-cases/record-turns.use-case";
import { SendMessage } from "../../application/use-cases/send-message.use-case";
import { FakeAiProvider } from "../../infrastructure/ai/ai-provider.fake";
import { FakeImageGenerator } from "../../infrastructure/ai/image-generator.fake";
import { FakeLiveTokenProvider } from "../../infrastructure/ai/live-token-provider.fake";
import { FakeTranscriber } from "../../infrastructure/ai/transcriber.fake";
import { FakeVideoGenerator } from "../../infrastructure/ai/video-generator.fake";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationController } from "./conversation.controller";

const buildController = (
  liveTokens = new FakeLiveTokenProvider(),
  imageGenerator = new FakeImageGenerator(),
  videoGenerator = new FakeVideoGenerator(),
) => {
  const repository = new InMemoryConversationRepository();
  const ai = new FakeAiProvider({ chunks: ["Hi", "!"] });
  const controller = new ConversationController(
    new BeginConversation(repository, ai),
    new BeginConversationWithTurns(repository),
    new ListConversations(repository),
    new GetConversation(repository),
    new SendMessage(repository, ai),
    new IssueLiveToken(liveTokens),
    new RecordTurns(repository),
    new InstructAgent(repository),
    new GenerateImage(repository, imageGenerator),
    new GenerateImageFromVoice(repository, new FakeTranscriber(), imageGenerator),
    new GenerateVideo(repository, videoGenerator),
  );
  return { controller, repository };
};

const seedConversation = async (repository: InMemoryConversationRepository) => {
  const conversation = Conversation.start();
  await repository.save(conversation);
  return conversation;
};

describe("ConversationController", () => {
  it("begins a conversation from the first message, announcing its id and streaming the reply", async () => {
    const { controller } = buildController();
    let assembled = "";
    let startedId = "";

    await controller.beginConversation({ content: "Hello", type: "text" }, (chunk) => {
      if (chunk.kind === "answer") assembled += chunk.text;
    }, (id) => {
      startedId = id;
    });

    expect(assembled).toBe("Hi!");
    expect(startedId).not.toBe("");
  });

  it("rejects beginning a conversation with an empty message", async () => {
    const { controller } = buildController();

    await expect(
      controller.beginConversation({ content: "  ", type: "text" }, () => {}, () => {}),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("lists conversations under a conversations key", async () => {
    const { controller, repository } = buildController();
    await seedConversation(repository);

    const dto = await controller.listConversations();

    expect(dto.conversations).toHaveLength(1);
  });

  it("gets a conversation and propagates not-found", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    expect((await controller.getConversation(started.id)).id).toBe(started.id);
    await expect(controller.getConversation("missing")).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });

  it("streams the assistant reply to the chunk listener for a valid message", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);
    let assembled = "";

    await controller.sendMessage(started.id, { content: "Hello", type: "text" }, (chunk) => {
      if (chunk.kind === "answer") assembled += chunk.text;
    });

    expect(assembled).toBe("Hi!");
  });

  it("rejects an invalid message body with field-level issues", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    const failing = controller.sendMessage(started.id, { content: "  ", type: "text" }, () => {});

    await expect(failing).rejects.toBeInstanceOf(ValidationError);
    await failing.catch((error: ValidationError) =>
      expect(error.issues).toContainEqual({ field: "content", message: "content must not be empty" }),
    );
  });

  it("rejects an unknown conversation before streaming", async () => {
    const { controller } = buildController();

    await expect(
      controller.sendMessage("missing", { content: "Hi", type: "text" }, () => {}),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("issues a live token shaped to the contract", async () => {
    const { controller } = buildController(
      new FakeLiveTokenProvider({
        token: {
          token: "auth_tokens/abc",
          expiresAt: "2026-05-25T00:30:00.000Z",
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
        },
      }),
    );

    const dto = await controller.issueLiveToken();

    expect(dto).toEqual({
      token: "auth_tokens/abc",
      expiresAt: "2026-05-25T00:30:00.000Z",
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
    });
  });

  it("propagates a token mint failure", async () => {
    const { controller } = buildController(new FakeLiveTokenProvider({ failure: new Error("mint failed") }));

    await expect(controller.issueLiveToken()).rejects.toThrow("mint failed");
  });

  it("begins a conversation from the first voice turns", async () => {
    const { controller } = buildController();

    const dto = await controller.beginConversationWithTurns({
      turns: [
        { role: "user", type: "voice", content: "Tell me a joke" },
        { role: "assistant", type: "voice", content: "Why did the chicken..." },
      ],
    });

    expect(dto.messages).toHaveLength(2);
    expect(dto.title).toBe("Tell me a joke");
    expect(dto.messages[0]?.type).toBe("voice");
  });

  it("records reported live turns into an existing conversation", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    const dto = await controller.recordTurns(started.id, {
      turns: [
        { role: "user", type: "voice", content: "Tell me a joke" },
        { role: "assistant", type: "voice", content: "Why did the chicken..." },
      ],
    });

    expect(dto.messages).toHaveLength(2);
    expect(dto.title).toBe("Tell me a joke");
    expect(dto.messages[0]?.type).toBe("voice");
  });

  it("rejects an empty turns payload with field-level issues", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    await expect(controller.recordTurns(started.id, { turns: [] })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects an invalid turn body", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    await expect(
      controller.recordTurns(started.id, { turns: [{ role: "user", type: "voice", content: "  " }] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects recording turns into an unknown conversation", async () => {
    const { controller } = buildController();

    await expect(
      controller.recordTurns("missing", {
        turns: [{ role: "user", type: "voice", content: "Hi" }],
      }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("propagates the turn-order invariant", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    await expect(
      controller.recordTurns(started.id, {
        turns: [{ role: "assistant", type: "voice", content: "I cannot lead." }],
      }),
    ).rejects.toBeInstanceOf(TurnOrderError);
  });

  it("generates an image and returns the updated conversation DTO carrying the image content", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    const dto = await controller.generateImage(started.id, { prompt: "Draw a cat", type: "text" });

    expect(dto.messages).toHaveLength(2);
    expect(dto.messages[0]?.content).toBe("Draw a cat");
    expect(dto.messages[1]?.contents[0]?.kind).toBe("image");
  });

  it("rejects an empty image prompt with field-level issues", async () => {
    const { controller, repository } = buildController();
    const started = await seedConversation(repository);

    await expect(
      controller.generateImage(started.id, { prompt: "  ", type: "text" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("generates a video reaching ready and exposes its status in the DTO", async () => {
    const { controller, repository } = buildController(
      new FakeLiveTokenProvider(),
      new FakeImageGenerator(),
      new FakeVideoGenerator({ outcome: { status: "ready", uri: "blob://beach.mp4" } }),
    );
    const started = await seedConversation(repository);

    const dto = await controller.generateVideo(started.id, { prompt: "a beach", type: "text" });

    const videoContent = dto.messages[1]?.contents[0];
    expect(videoContent?.kind).toBe("video");
    expect(videoContent).toMatchObject({ status: "ready", uri: "blob://beach.mp4" });
  });

  it("rejects generating an image for an unknown conversation", async () => {
    const { controller } = buildController();

    await expect(
      controller.generateImage("missing", { prompt: "Draw a cat", type: "text" }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
