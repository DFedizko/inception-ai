import type { GeneratedVideo } from "../entities/generated-video.entity";
import type { AudioContent } from "./audio-content.value-object";
import type { ImageContent } from "./image-content.value-object";
import type { TextContent } from "./text-content.value-object";

export type ContentKind = "text" | "audio" | "image" | "video";

export type Content = TextContent | AudioContent | ImageContent | GeneratedVideo;

export const isPromptContent = (content: Content): boolean =>
  content.kind === "text" || content.kind === "audio";
