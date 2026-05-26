import { z } from "zod";

export const capabilitySchema = z.enum(["text", "speech", "live", "image", "video"]);

export const tierSchema = z.enum(["free", "paid", "unknown"]);

export const modelInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  capabilities: z.array(capabilitySchema),
  tier: tierSchema,
});

export const modelCatalogSchema = z.object({
  models: z.array(modelInfoSchema),
});

export type ModelInfo = z.infer<typeof modelInfoSchema>;
export type ModelCatalogDTO = z.infer<typeof modelCatalogSchema>;
