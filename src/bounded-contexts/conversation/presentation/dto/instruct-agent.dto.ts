import { z } from "zod";

export const instructAgentBodySchema = z.object({
  instruction: z.string().trim().min(1, "instruction must not be empty"),
});

export type InstructAgentBody = z.infer<typeof instructAgentBodySchema>;
