import { UUID } from "@/features/shared/value-objects/uuid";

export type Role = "user" | "assistant";
export type Type = "text" | "voice";

export type VideoStatus = "pending" | "generating" | "ready" | "failed";

export type TextContent = { kind: "text"; text: string };
export type AudioContent = { kind: "audio"; uri: string; mimeType: string; durationMs: number };
export type ImageContent = {
  kind: "image";
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
};
export type VideoContent = {
  kind: "video";
  status: VideoStatus;
  prompt: string;
  uri: string | null;
  failureReason: string | null;
};

export type Content = TextContent | AudioContent | ImageContent | VideoContent;

export class Message {
  constructor(
    readonly id: UUID,
    readonly role: Role,
    readonly type: Type,
    readonly content: string,
    readonly createdAt: string,
    readonly contents: Content[] = [],
    readonly thinking: string = "",
  ) {}

  isFromUser(): boolean {
    return this.role === "user";
  }

  isFromAssistant(): boolean {
    return this.role === "assistant";
  }

  hasText(): boolean {
    return this.content.length > 0;
  }

  hasThinking(): boolean {
    return this.thinking.length > 0;
  }

  media(): Content[] {
    return this.contents.filter(
      (content) => content.kind === "image" || content.kind === "video",
    );
  }

  withAppended(chunk: string): Message {
    return new Message(
      this.id,
      this.role,
      this.type,
      this.content + chunk,
      this.createdAt,
      this.contents,
      this.thinking,
    );
  }

  withAppendedThought(chunk: string): Message {
    return new Message(
      this.id,
      this.role,
      this.type,
      this.content,
      this.createdAt,
      this.contents,
      this.thinking + chunk,
    );
  }
}
