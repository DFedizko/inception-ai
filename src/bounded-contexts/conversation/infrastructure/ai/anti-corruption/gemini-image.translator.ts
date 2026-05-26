export type GeminiImagePart = {
  text?: string;
  inlineData?: { data?: string; mimeType?: string };
};

export type GeminiImageResponse = {
  candidates?: { content?: { parts?: GeminiImagePart[] } }[];
};

export type GeneratedImageData = { data: Uint8Array; mimeType: string };

export const extractGeneratedImage = (response: GeminiImageResponse): GeneratedImageData => {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new MissingGeneratedImageError();
  }

  return {
    data: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
  };
};

export class MissingGeneratedImageError extends Error {
  constructor() {
    super("Gemini returned no image data for the prompt.");
    this.name = "MissingGeneratedImageError";
  }
}
