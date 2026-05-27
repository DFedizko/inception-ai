import type { Tier } from "../value-objects/tier.value-object";

const paidModelPrefixes = [
  "gemini-3",
  "gemini-2.5-pro",
  "gemini-2.5-flash-image",
  "gemini-2.5-computer-use",
  "imagen",
  "veo",
  "lyria",
];

const freeModelPrefixes = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-embedding",
  "gemma",
];

export const deriveTierFromModelId = (modelId: string): Tier => {
  if (paidModelPrefixes.some((prefix) => modelId.startsWith(prefix))) return "paid";
  if (freeModelPrefixes.some((prefix) => modelId.startsWith(prefix))) return "free";
  return "unknown";
};
