import type { Capability, Tier } from "../../../model/ai-model.model";

type ModelInfoDto = { id: string; label: string; capabilities: Capability[]; tier: Tier };

export const textModelDto: ModelInfoDto = {
  id: "text-1",
  label: "Modelo Texto",
  capabilities: ["text"],
  tier: "free",
};

export const liveModelDto: ModelInfoDto = {
  id: "live-1",
  label: "Modelo Voz",
  capabilities: ["text", "live"],
  tier: "free",
};

export const mediaModelDto: ModelInfoDto = {
  id: "media-1",
  label: "Modelo Mídia",
  capabilities: ["text", "image", "video"],
  tier: "paid",
};

export const modelsResponse: { models: ModelInfoDto[] } = {
  models: [textModelDto, liveModelDto, mediaModelDto],
};
