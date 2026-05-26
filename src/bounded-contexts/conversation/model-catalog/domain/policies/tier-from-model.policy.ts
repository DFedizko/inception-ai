import type { Tier } from "../value-objects/tier.value-object";

const paidModelPrefixes = [
  "gemini-3.1-pro",
  "gemini-3-pro",
  "gemini-2.5-pro-preview-tts",
  "gemini-2.5-computer-use",
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "imagen",
  "veo",
  "lyria",
];

const freeModelPrefixes = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-live",
  "gemini-3.1-flash-tts",
  "gemini-3-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-embedding",
  "gemini-robotics",
  "gemma",
];

export const deriveTierFromModelId = (modelId: string): Tier => {
  if (paidModelPrefixes.some((prefix) => modelId.startsWith(prefix))) return "paid";
  if (freeModelPrefixes.some((prefix) => modelId.startsWith(prefix))) return "free";
  return "unknown";
};
