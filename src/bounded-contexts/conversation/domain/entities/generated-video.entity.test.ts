import { describe, expect, it } from "bun:test";
import {
  EmptyVideoPromptError,
  GeneratedVideo,
  InvalidVideoTransitionError,
} from "./generated-video.entity";

describe("GeneratedVideo", () => {
  it("is requested as pending with an identity and a prompt", () => {
    const video = GeneratedVideo.requested("a beach at sunset");

    expect(video.kind).toBe("video");
    expect(video.id).toBeString();
    expect(video.prompt).toBe("a beach at sunset");
    expect(video.status.isPending()).toBe(true);
  });

  it("rejects an empty prompt", () => {
    expect(() => GeneratedVideo.requested("   ")).toThrow(EmptyVideoPromptError);
  });

  it("walks the lifecycle pending → generating → ready with a uri", () => {
    const video = GeneratedVideo.requested("a cat");

    video.startGenerating();
    expect(video.status.isGenerating()).toBe(true);

    video.markReady("blob://cat.mp4");
    expect(video.status.isReady()).toBe(true);
    expect(video.uri).toBe("blob://cat.mp4");
  });

  it("can fail while generating, keeping the reason", () => {
    const video = GeneratedVideo.requested("a cat");
    video.startGenerating();

    video.markFailed("provider timeout");

    expect(video.status.isFailed()).toBe(true);
    expect(video.failureReason).toBe("provider timeout");
  });

  it("forbids marking ready before it started generating", () => {
    const video = GeneratedVideo.requested("a cat");

    expect(() => video.markReady("blob://x.mp4")).toThrow(InvalidVideoTransitionError);
  });

  it("forbids a ready video without a uri", () => {
    const video = GeneratedVideo.requested("a cat");
    video.startGenerating();

    expect(() => video.markReady("  ")).toThrow(InvalidVideoTransitionError);
  });
});
