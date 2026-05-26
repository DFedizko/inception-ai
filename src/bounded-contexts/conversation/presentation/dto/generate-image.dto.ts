import { z } from "zod";

export const generateImageBodySchema = z.object({
  prompt: z.string().trim().min(1, "prompt must not be empty"),
  type: z.enum(["text", "voice"]),
});

export type GenerateImageBody = z.infer<typeof generateImageBodySchema>;
