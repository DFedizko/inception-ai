import { z } from "zod";

export const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1, "content must not be empty"),
  type: z.literal("text"),
});

export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;
