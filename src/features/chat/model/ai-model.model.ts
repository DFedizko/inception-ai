export type Capability = "text" | "speech" | "live" | "image" | "video";

export type Tier = "free" | "paid" | "unknown";

export type AiModel = {
  id: string;
  label: string;
  capabilities: Capability[];
  tier: Tier;
};
