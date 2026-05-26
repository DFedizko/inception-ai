import { describe, expect, it } from "bun:test";
import { InMemoryMediaStorage } from "../../../shared/storage/media-storage.in-memory";
import { type GeminiVideoClient, GeminiVideoGenerator } from "./video-generator.gemini";

const noDelay = async () => {};
const fetchBytes = async () => new Uint8Array([9, 9, 9]);

describe("GeminiVideoGenerator", () => {
  it("polls until done, downloads the video, stores it and returns the stored url", async () => {
    let polls = 0;
    const client: GeminiVideoClient = {
      models: { generateVideos: async () => ({ done: false }) },
      operations: {
        getVideosOperation: async () => {
          polls += 1;
          return polls >= 2
            ? { done: true, response: { generatedVideos: [{ video: { uri: "https://files/v.mp4" } }] } }
            : { done: false };
        },
      },
    };
    const storage = new InMemoryMediaStorage();

    const outcome = await new GeminiVideoGenerator(
      client,
      storage,
      fetchBytes,
      "veo",
      noDelay,
    ).generate("a beach");

    expect(outcome).toEqual({ status: "ready", uri: "memory://0" });
    expect(polls).toBe(2);
    expect(Array.from(storage.stored[0]!.data)).toEqual([9, 9, 9]);
  });

  it("returns a failed outcome when the operation reports an error, without storing", async () => {
    const client: GeminiVideoClient = {
      models: { generateVideos: async () => ({ done: true, error: { message: "quota exceeded" } }) },
      operations: { getVideosOperation: async () => ({ done: true }) },
    };
    const storage = new InMemoryMediaStorage();

    const outcome = await new GeminiVideoGenerator(
      client,
      storage,
      fetchBytes,
      "veo",
      noDelay,
    ).generate("a beach");

    expect(outcome).toEqual({ status: "failed", reason: "quota exceeded" });
    expect(storage.stored).toHaveLength(0);
  });
});
