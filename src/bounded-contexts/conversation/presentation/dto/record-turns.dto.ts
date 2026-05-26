import { z } from "zod";

export const turnInputSchema = z.object({
  role: z.enum(["user", "assistant"]),
  type: z.enum(["text", "voice"]),
  content: z.string().trim().min(1, "content must not be empty"),
});

export const recordTurnsBodySchema = z.object({
  turns: z.array(turnInputSchema).min(1, "turns must not be empty"),
});

export type RecordTurnsBody = z.infer<typeof recordTurnsBodySchema>;
