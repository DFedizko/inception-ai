import { z } from "zod";

export const generateVideoBodySchema = z.object({
  prompt: z.string().trim().min(1, "prompt must not be empty"),
  type: z.enum(["text", "voice"]),
});

export type GenerateVideoBody = z.infer<typeof generateVideoBodySchema>;
