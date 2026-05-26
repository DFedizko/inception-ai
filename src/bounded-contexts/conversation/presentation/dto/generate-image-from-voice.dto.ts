import { z } from "zod";

export const generateImageFromVoiceBodySchema = z.object({
  audio: z.string().min(1, "audio must not be empty"),
  mimeType: z.string().min(1, "mimeType must not be empty"),
});

export type GenerateImageFromVoiceBody = z.infer<typeof generateImageFromVoiceBodySchema>;
