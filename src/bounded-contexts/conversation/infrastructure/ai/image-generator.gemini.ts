import { GoogleGenAI } from "@google/genai";
import type { MediaStorage } from "../../../shared/storage/media-storage";
import { createFilesystemMediaStorage } from "../../../shared/storage/media-storage.filesystem";
import type { ImageGenerator } from "../../application/ports/image-generator";
import { ImageContent } from "../../domain/value-objects/image-content.value-object";
import {
  extractGeneratedImage,
  type GeminiImageResponse,
} from "./anti-corruption/gemini-image.translator";

export interface GeminiImageClient {
  models: {
    generateContent(args: {
      model: string;
      contents: string;
      config?: { responseModalities: string[] };
    }): Promise<GeminiImageResponse>;
  };
}

const defaultImageModel = "gemini-2.5-flash-image";

export class GeminiImageGenerator implements ImageGenerator {
  constructor(
    private readonly client: GeminiImageClient,
    private readonly storage: MediaStorage,
    private readonly model: string = process.env.GEMINI_IMAGE_MODEL ?? defaultImageModel,
  ) {}

  async generate(prompt: string): Promise<ImageContent> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });
    const { data, mimeType } = extractGeneratedImage(response);
    const { url } = await this.storage.store(data, mimeType);
    return ImageContent.of({ uri: url, mimeType });
  }
}

export const createGeminiImageGenerator = (
  storage: MediaStorage = createFilesystemMediaStorage(),
): GeminiImageGenerator => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GeminiImageGenerator(
    new GoogleGenAI({ apiKey }) as unknown as GeminiImageClient,
    storage,
  );
};
