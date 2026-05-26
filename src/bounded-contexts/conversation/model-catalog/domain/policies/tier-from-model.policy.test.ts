import { describe, expect, it } from "bun:test";

import { deriveTierFromModelId } from "./tier-from-model.policy";

describe("deriveTierFromModelId", () => {
  it("marks models with a Gemini free tier as free", () => {
    expect(deriveTierFromModelId("gemini-3.5-flash")).toBe("free");
    expect(deriveTierFromModelId("gemini-3.1-flash-lite")).toBe("free");
    expect(deriveTierFromModelId("gemini-3-flash-preview")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash-lite")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-pro")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash-native-audio-preview-12-2025")).toBe("free");
    expect(deriveTierFromModelId("gemini-3.1-flash-live-preview")).toBe("free");
    expect(deriveTierFromModelId("gemini-3.1-flash-tts-preview")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash-preview-tts")).toBe("free");
    expect(deriveTierFromModelId("gemini-embedding-001")).toBe("free");
  });

  it("marks paid-only models as paid", () => {
    expect(deriveTierFromModelId("gemini-3.1-pro-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3-pro-preview")).toBe("paid");
    expect(deriveTierFromModelId("imagen-4.0-generate-001")).toBe("paid");
    expect(deriveTierFromModelId("veo-3.1-generate-preview")).toBe("paid");
    expect(deriveTierFromModelId("lyria-3-pro-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-2.5-computer-use-preview-10-2025")).toBe("paid");
  });

  it("classifies paid models that share a free family prefix as paid (money-safe)", () => {
    expect(deriveTierFromModelId("gemini-2.5-flash-image")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3.1-flash-image-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3-pro-image-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-2.5-pro-preview-tts")).toBe("paid");
  });

  it("marks unrecognized future models as unknown instead of guessing", () => {
    expect(deriveTierFromModelId("gemini-9-mystery")).toBe("unknown");
    expect(deriveTierFromModelId("some-future-model")).toBe("unknown");
  });
});
