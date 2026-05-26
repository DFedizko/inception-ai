import { describe, expect, it } from "bun:test";
import { InvalidVideoStatusError, VideoStatus } from "./video-status.value-object";

describe("VideoStatus", () => {
  it("allows pending → generating → ready", () => {
    expect(VideoStatus.pending().canTransitionTo(VideoStatus.generating())).toBe(true);
    expect(VideoStatus.generating().canTransitionTo(VideoStatus.ready())).toBe(true);
  });

  it("allows generating → failed", () => {
    expect(VideoStatus.generating().canTransitionTo(VideoStatus.failed())).toBe(true);
  });

  it("forbids skipping straight from pending to ready", () => {
    expect(VideoStatus.pending().canTransitionTo(VideoStatus.ready())).toBe(false);
  });

  it("treats ready and failed as terminal", () => {
    expect(VideoStatus.ready().canTransitionTo(VideoStatus.generating())).toBe(false);
    expect(VideoStatus.failed().canTransitionTo(VideoStatus.generating())).toBe(false);
  });

  it("rejects an unsupported value", () => {
    expect(() => VideoStatus.fromString("done")).toThrow(InvalidVideoStatusError);
  });
});
