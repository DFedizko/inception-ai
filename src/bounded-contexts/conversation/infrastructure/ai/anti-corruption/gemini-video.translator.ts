import type { VideoGenerationOutcome } from "../../../application/ports/video-generator";

export type GeminiVideoOperation = {
  done?: boolean;
  error?: { message?: string };
  response?: { generatedVideos?: { video?: { uri?: string } }[] };
};

export const toVideoOutcome = (operation: GeminiVideoOperation): VideoGenerationOutcome => {
  if (operation.error) {
    return { status: "failed", reason: operation.error.message ?? "Video generation failed." };
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) {
    return { status: "failed", reason: "Gemini returned no video for the prompt." };
  }

  return { status: "ready", uri };
};
