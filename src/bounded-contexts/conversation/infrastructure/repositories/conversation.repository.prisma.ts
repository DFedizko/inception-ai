import type { PrismaClient } from "@/generated/prisma/client";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { GeneratedVideo } from "../../domain/entities/generated-video.entity";
import { Message } from "../../domain/entities/message.entity";
import { Agent } from "../../domain/value-objects/agent.value-object";
import { AudioContent } from "../../domain/value-objects/audio-content.value-object";
import { Instruction } from "../../domain/value-objects/instruction.value-object";
import type { Content } from "../../domain/value-objects/content";
import { ImageContent } from "../../domain/value-objects/image-content.value-object";
import { Modality } from "../../domain/value-objects/modality.value-object";
import { Role } from "../../domain/value-objects/role.value-object";
import { TextContent } from "../../domain/value-objects/text-content.value-object";
import { Title } from "../../domain/value-objects/title.value-object";
import { VideoStatus } from "../../domain/value-objects/video-status.value-object";
import type { ConversationRepository } from "../../application/ports/conversation-repository";

type ContentRecord = {
  id: string;
  position: number;
  kind: string;
  text: string | null;
  uri: string | null;
  mimeType: string | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  videoStatus: string | null;
  videoPrompt: string | null;
  videoFailure: string | null;
  createdAt: Date;
};

type MessageRecord = {
  id: string;
  role: string;
  type: string;
  createdAt: Date;
  responseDurationMs: number | null;
  contents: ContentRecord[];
};

export class ConversationRepositoryPrisma implements ConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(conversation: Conversation): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.conversation.upsert({
        where: { id: conversation.id },
        update: {
          title: conversation.title.toString(),
          instruction: conversation.instructionText(),
        },
        create: {
          id: conversation.id,
          title: conversation.title.toString(),
          instruction: conversation.instructionText(),
          createdAt: conversation.createdAt,
        },
      });

      for (const [position, message] of conversation.messages.entries()) {
        await tx.message.upsert({
          where: { id: message.id },
          update: { position },
          create: {
            id: message.id,
            conversationId: conversation.id,
            role: message.role.toString(),
            type: message.modality.toString(),
            createdAt: message.createdAt,
            position,
            responseDurationMs: message.responseDurationMs ?? null,
          },
        });

        for (const [contentPosition, content] of message.contents.entries()) {
          const { id, ...data } = this.toContentData(content, message, contentPosition);
          await tx.messageContent.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
          });
        }
      }
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { position: "asc" },
          include: { contents: { orderBy: { position: "asc" } } },
        },
      },
    });
    if (!row) {
      return null;
    }

    return Conversation.reconstitute({
      id: row.id,
      title: Title.of(row.title),
      createdAt: row.createdAt,
      agent: row.instruction
        ? Agent.instructedBy(Instruction.of(row.instruction))
        : Agent.withoutInstruction(),
      messages: row.messages.map((message) => this.toMessage(message)),
    });
  }

  private toContentData(content: Content, message: Message, position: number) {
    const base = {
      id: content.kind === "video" ? content.id : `${message.id}:${position}`,
      messageId: message.id,
      position,
      kind: content.kind,
      text: null as string | null,
      uri: null as string | null,
      mimeType: null as string | null,
      durationMs: null as number | null,
      width: null as number | null,
      height: null as number | null,
      videoStatus: null as string | null,
      videoPrompt: null as string | null,
      videoFailure: null as string | null,
      createdAt: message.createdAt,
    };

    switch (content.kind) {
      case "text":
        return { ...base, text: content.toString() };
      case "audio":
        return { ...base, uri: content.uri, mimeType: content.mimeType, durationMs: content.durationMs };
      case "image":
        return {
          ...base,
          uri: content.uri,
          mimeType: content.mimeType,
          width: content.width ?? null,
          height: content.height ?? null,
        };
      case "video":
        return {
          ...base,
          uri: content.uri ?? null,
          videoStatus: content.status.toString(),
          videoPrompt: content.prompt,
          videoFailure: content.failureReason ?? null,
        };
    }
  }

  private toMessage(record: MessageRecord): Message {
    return Message.reconstitute({
      id: record.id,
      role: Role.fromString(record.role),
      modality: Modality.fromString(record.type),
      contents: record.contents.map((content) => this.toContent(content)),
      createdAt: record.createdAt,
      responseDurationMs: record.responseDurationMs ?? undefined,
    });
  }

  private toContent(record: ContentRecord): Content {
    switch (record.kind) {
      case "text":
        return TextContent.of(record.text ?? "");
      case "audio":
        return AudioContent.of({
          uri: record.uri ?? "",
          mimeType: record.mimeType ?? "",
          durationMs: record.durationMs ?? 0,
        });
      case "image":
        return ImageContent.of({
          uri: record.uri ?? "",
          mimeType: record.mimeType ?? "",
          width: record.width ?? undefined,
          height: record.height ?? undefined,
        });
      case "video":
        return GeneratedVideo.reconstitute({
          id: record.id,
          prompt: record.videoPrompt ?? "",
          status: VideoStatus.fromString(record.videoStatus ?? "pending"),
          uri: record.uri ?? undefined,
          failureReason: record.videoFailure ?? undefined,
          createdAt: record.createdAt,
        });
      default:
        throw new UnknownContentKindError(record.kind);
    }
  }
}

export class UnknownContentKindError extends Error {
  constructor(kind: string) {
    super(`Cannot reconstitute an unknown content kind: "${kind}".`);
    this.name = "UnknownContentKindError";
  }
}
