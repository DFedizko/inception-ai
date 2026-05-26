import { z } from "zod";

export const liveTokenDtoSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  model: z.string(),
});

export type LiveTokenDTO = z.infer<typeof liveTokenDtoSchema>;
