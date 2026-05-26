import { GoogleGenAI } from "@google/genai";
import type { MediaStorage } from "../../../shared/storage/media-storage";
import { createFilesystemMediaStorage } from "../../../shared/storage/media-storage.filesystem";
import type {
  VideoGenerationOutcome,
  VideoGenerator,
} from "../../application/ports/video-generator";
import {
  type GeminiVideoOperation,
  toVideoOutcome,
} from "./anti-corruption/gemini-video.translator";

export interface GeminiVideoClient {
  models: {
    generateVideos(args: { model: string; prompt: string }): Promise<GeminiVideoOperation>;
  };
  operations: {
    getVideosOperation(args: { operation: GeminiVideoOperation }): Promise<GeminiVideoOperation>;
  };
}

export type FetchVideoBytes = (uri: string) => Promise<Uint8Array>;
type Delay = (ms: number) => Promise<void>;

const defaultVideoModel = "veo-3.1-fast-generate-preview";
const pollIntervalMs = 10_000;
const maxPolls = 60;

export class GeminiVideoGenerator implements VideoGenerator {
  constructor(
    private readonly client: GeminiVideoClient,
    private readonly storage: MediaStorage,
    private readonly fetchBytes: FetchVideoBytes,
    private readonly model: string = process.env.GEMINI_VIDEO_MODEL ?? defaultVideoModel,
    private readonly delay: Delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ) {}

  async generate(prompt: string): Promise<VideoGenerationOutcome> {
    let operation = await this.client.models.generateVideos({ model: this.model, prompt });

    let polls = 0;
    while (!operation.done && polls < maxPolls) {
      await this.delay(pollIntervalMs);
      operation = await this.client.operations.getVideosOperation({ operation });
      polls += 1;
    }

    if (!operation.done) {
      return { status: "failed", reason: "Video generation timed out." };
    }

    const outcome = toVideoOutcome(operation);
    if (outcome.status === "failed") {
      return outcome;
    }

    try {
      const bytes = await this.fetchBytes(outcome.uri);
      const { url } = await this.storage.store(bytes, "video/mp4");
      return { status: "ready", uri: url };
    } catch {
      return { status: "failed", reason: "Could not download the generated video." };
    }
  }
}

export const createGeminiVideoGenerator = (
  storage: MediaStorage = createFilesystemMediaStorage(),
): GeminiVideoGenerator => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  const fetchBytes: FetchVideoBytes = async (uri) => {
    const response = await fetch(uri, { headers: { "x-goog-api-key": apiKey } });
    return new Uint8Array(await response.arrayBuffer());
  };
  return new GeminiVideoGenerator(
    new GoogleGenAI({ apiKey }) as unknown as GeminiVideoClient,
    storage,
    fetchBytes,
  );
};
