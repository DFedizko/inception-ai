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

export type Message = {
  id: string;
  role: Role;
  type: Type;
  content: string;
  contents?: Content[];
  createdAt: string;
};
