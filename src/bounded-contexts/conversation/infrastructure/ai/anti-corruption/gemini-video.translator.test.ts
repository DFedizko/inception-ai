import { describe, expect, it } from "bun:test";
import { toVideoOutcome } from "./gemini-video.translator";

describe("toVideoOutcome", () => {
  it("maps a finished operation to a ready outcome with its uri", () => {
    expect(
      toVideoOutcome({
        done: true,
        response: { generatedVideos: [{ video: { uri: "https://files/v.mp4" } }] },
      }),
    ).toEqual({ status: "ready", uri: "https://files/v.mp4" });
  });

  it("maps an operation error to a failed outcome", () => {
    expect(toVideoOutcome({ done: true, error: { message: "quota exceeded" } })).toEqual({
      status: "failed",
      reason: "quota exceeded",
    });
  });

  it("fails when the operation returns no video", () => {
    expect(toVideoOutcome({ done: true, response: { generatedVideos: [] } }).status).toBe("failed");
  });
});
