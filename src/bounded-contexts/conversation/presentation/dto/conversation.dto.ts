import { z } from "zod";

export const contentDtoSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({
    kind: z.literal("audio"),
    uri: z.string(),
    mimeType: z.string(),
    durationMs: z.number(),
  }),
  z.object({
    kind: z.literal("image"),
    uri: z.string(),
    mimeType: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  z.object({
    kind: z.literal("video"),
    status: z.enum(["pending", "generating", "ready", "failed"]),
    prompt: z.string(),
    uri: z.string().nullable(),
    failureReason: z.string().nullable(),
  }),
]);

export type ContentDTO = z.infer<typeof contentDtoSchema>;

export const messageDtoSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  type: z.enum(["text", "voice"]),
  content: z.string(),
  contents: z.array(contentDtoSchema),
  createdAt: z.string(),
});

export type MessageDTO = z.infer<typeof messageDtoSchema>;

export const conversationDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  instruction: z.string().nullable(),
  messages: z.array(messageDtoSchema),
});

export type ConversationDTO = z.infer<typeof conversationDtoSchema>;

export const conversationSummaryDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
});

export type ConversationSummaryDTO = z.infer<typeof conversationSummaryDtoSchema>;

export const conversationListDtoSchema = z.object({
  conversations: z.array(conversationSummaryDtoSchema),
});

export type ConversationListDTO = z.infer<typeof conversationListDtoSchema>;
