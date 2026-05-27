import { describe, expect, it } from "bun:test";

import { deriveTierFromModelId } from "./tier-from-model.policy";

describe("deriveTierFromModelId", () => {
  it("marks the genuinely free-tier families as free", () => {
    expect(deriveTierFromModelId("gemini-2.5-flash")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash-lite")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash-native-audio-preview-12-2025")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.5-flash-preview-tts")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.0-flash")).toBe("free");
    expect(deriveTierFromModelId("gemini-2.0-flash-lite-001")).toBe("free");
    expect(deriveTierFromModelId("gemini-embedding-001")).toBe("free");
    expect(deriveTierFromModelId("gemma-4-31b-it")).toBe("free");
  });

  it("marks 2.5 Pro as paid (lost its free tier on 2026-04-01)", () => {
    expect(deriveTierFromModelId("gemini-2.5-pro")).toBe("paid");
    expect(deriveTierFromModelId("gemini-2.5-pro-preview-tts")).toBe("paid");
  });

  it("marks the whole Gemini 3.x family as paid (paid-only preview)", () => {
    expect(deriveTierFromModelId("gemini-3.5-flash")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3.1-flash-lite")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3.1-flash-live-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3-flash-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3.1-pro-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-3-pro-preview")).toBe("paid");
  });

  it("marks media and specialty models as paid", () => {
    expect(deriveTierFromModelId("gemini-2.5-flash-image")).toBe("paid");
    expect(deriveTierFromModelId("imagen-4.0-generate-001")).toBe("paid");
    expect(deriveTierFromModelId("veo-3.1-generate-preview")).toBe("paid");
    expect(deriveTierFromModelId("lyria-3-pro-preview")).toBe("paid");
    expect(deriveTierFromModelId("gemini-2.5-computer-use-preview-10-2025")).toBe("paid");
  });

  it("keeps a free family prefix free for its flash variants", () => {
    expect(deriveTierFromModelId("gemini-2.5-flash-001")).toBe("free");
  });

  it("marks unrecognized or uncertain models as unknown instead of guessing", () => {
    expect(deriveTierFromModelId("gemini-robotics-er-1.6-preview")).toBe("unknown");
    expect(deriveTierFromModelId("gemini-9-mystery")).toBe("unknown");
    expect(deriveTierFromModelId("some-future-model")).toBe("unknown");
  });
});
