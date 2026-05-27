import { z } from "zod";

export const agentVoiceSnapshotSchema = z.object({
  voiceId: z.string().min(1),
});

export const agentVersionSnapshotSchema = z.object({
  agentId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  versionName: z.string().min(1),
  instruction: z.string().nullable(),
  modelId: z.string().min(1),
  temperature: z.number().min(0).max(2),
  toneOfVoice: z.string().nullable(),
  voice: agentVoiceSnapshotSchema.nullable(),
});

export type AgentVersionSnapshot = z.infer<typeof agentVersionSnapshotSchema>;
