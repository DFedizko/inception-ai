import { execSync } from "node:child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { PrismaClient } from "@/generated/prisma/client";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { GeneratedVideo } from "../../domain/entities/generated-video.entity";
import { ImageContent } from "../../domain/value-objects/image-content.value-object";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { Title } from "../../domain/value-objects/title.value-object";
import { createPrismaClient } from "../persistence/prisma-client";
import { ConversationSummariesDaoPrisma } from "./conversation-summaries.dao.prisma";
import { ConversationRepositoryPrisma } from "./conversation.repository.prisma";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set — start the test database with `docker compose up -d` and see .env.example.",
  );
}

let prisma: PrismaClient;

beforeAll(() => {
  execSync("bunx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "ignore",
  });
  prisma = createPrismaClient(testDatabaseUrl);
}, 60_000);

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
});

describe("ConversationRepositoryPrisma", () => {
  it("persists and reloads a conversation with its ordered messages", async () => {
    const repository = new ConversationRepositoryPrisma(prisma);
    const conversation = Conversation.start();
    conversation.recordUserMessage("Hello", Modality.text());
    conversation.recordAssistantReply("Hi there", Modality.text(), 1500);
    await repository.save(conversation);

    const reloaded = await repository.findById(conversation.id);

    expect(reloaded?.id).toBe(conversation.id);
    expect(reloaded?.title.toString()).toBe("Hello");
    expect(reloaded?.messages.map((message) => message.text())).toEqual(["Hello", "Hi there"]);
    expect(reloaded?.messages[0]?.isFromUser()).toBe(true);
    expect(reloaded?.messages[1]?.isFromAssistant()).toBe(true);
    expect(reloaded?.messages[0]?.responseDurationMs).toBeUndefined();
    expect(reloaded?.messages[1]?.responseDurationMs).toBe(1500);
  });

  it("returns null for an unknown id", async () => {
    const repository = new ConversationRepositoryPrisma(prisma);

    expect(await repository.findById("missing")).toBeNull();
  });

  it("appends newly recorded messages when saving the same conversation again", async () => {
    const repository = new ConversationRepositoryPrisma(prisma);
    const conversation = Conversation.start();
    conversation.recordUserMessage("First", Modality.text());
    await repository.save(conversation);

    conversation.recordAssistantReply("Answer", Modality.text());
    conversation.recordUserMessage("Second", Modality.text());
    await repository.save(conversation);

    const reloaded = await repository.findById(conversation.id);
    expect(reloaded?.messages.map((message) => message.text())).toEqual([
      "First",
      "Answer",
      "Second",
    ]);
  });
  it("persists and reloads an assistant image with its dimensions", async () => {
    const repository = new ConversationRepositoryPrisma(prisma);
    const conversation = Conversation.start();
    conversation.recordUserMessage("Draw a cat", Modality.text());
    conversation.recordAssistantContent(Modality.text(), [
      ImageContent.of({ uri: "blob://cat.png", mimeType: "image/png", width: 1024, height: 768 }),
    ]);
    await repository.save(conversation);

    const reloaded = await repository.findById(conversation.id);
    const [, assistantTurn] = reloaded?.messages ?? [];
    const [content] = assistantTurn?.contents ?? [];

    expect(content).toBeInstanceOf(ImageContent);
    expect(content as ImageContent).toMatchObject({ uri: "blob://cat.png", width: 1024, height: 768 });
  });

  it("persists a video lifecycle update across saves (pending → ready)", async () => {
    const repository = new ConversationRepositoryPrisma(prisma);
    const conversation = Conversation.start();
    conversation.recordUserMessage("Make a beach video", Modality.text());
    const video = GeneratedVideo.requested("a beach at sunset");
    conversation.recordAssistantContent(Modality.text(), [video]);
    await repository.save(conversation);

    const pending = await repository.findById(conversation.id);
    expect(((pending?.messages[1]?.contents[0]) as GeneratedVideo).status.isPending()).toBe(true);

    video.startGenerating();
    video.markReady("blob://beach.mp4");
    await repository.save(conversation);

    const ready = await repository.findById(conversation.id);
    const reloadedVideo = ready?.messages[1]?.contents[0] as GeneratedVideo;
    expect(reloadedVideo).toBeInstanceOf(GeneratedVideo);
    expect(reloadedVideo.status.isReady()).toBe(true);
    expect(reloadedVideo.uri).toBe("blob://beach.mp4");
    expect(reloadedVideo.prompt).toBe("a beach at sunset");
    expect(ready?.messages[1]?.contents).toHaveLength(1);
  });
});

describe("ConversationSummariesDaoPrisma", () => {
  it("lists conversation summaries newest first", async () => {
    const repository = new ConversationRepositoryPrisma(prisma);
    const dao = new ConversationSummariesDaoPrisma(prisma);

    const older = Conversation.reconstitute({
      id: "older",
      title: Title.of("Older"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      messages: [],
    });
    await repository.save(older);
    const newer = Conversation.start();
    newer.recordUserMessage("Newest topic", Modality.text());
    await repository.save(newer);

    const summaries = await dao.listNewestFirst();

    expect(summaries[0]?.title).toBe("Newest topic");
    expect(summaries.map((summary) => summary.id)).toContain("older");
    expect(summaries[0]?.createdAt).toBeInstanceOf(Date);
  });
});
