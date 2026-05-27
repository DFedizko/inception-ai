import { describe, expect, it } from "bun:test";

import { AiModel, type Capability } from "./ai-model.model";

const withCapabilities = (capabilities: Capability[]) =>
  new AiModel("gemini", "Gemini", capabilities, "free");

describe("AiModel", () => {
  it("knows when it can hold a live voice session", () => {
    expect(withCapabilities(["text", "live"]).isLive()).toBe(true);
    expect(withCapabilities(["text"]).isLive()).toBe(false);
  });

  it("knows when it can generate images", () => {
    expect(withCapabilities(["text", "image"]).canGenerateImage()).toBe(true);
    expect(withCapabilities(["text"]).canGenerateImage()).toBe(false);
  });

  it("knows when it can generate videos", () => {
    expect(withCapabilities(["text", "video"]).canGenerateVideo()).toBe(true);
    expect(withCapabilities(["text"]).canGenerateVideo()).toBe(false);
  });

  it("knows when it can hold a text conversation", () => {
    expect(withCapabilities(["text"]).isTextCapable()).toBe(true);
    expect(withCapabilities(["live"]).isTextCapable()).toBe(false);
  });

  it("answers any capability through a single check", () => {
    const model = withCapabilities(["text", "speech"]);
    expect(model.supports("speech")).toBe(true);
    expect(model.supports("video")).toBe(false);
  });
});
