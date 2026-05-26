import { describe, expect, it } from "bun:test";
import { Capability } from "../value-objects/capability.value-object";
import { deriveCapabilitiesFromProviderModel } from "./capabilities-from-provider-model.policy";

const valuesOf = (capabilities: Capability[]) => capabilities.map((capability) => capability.toString());

describe("deriveCapabilitiesFromProviderModel", () => {
  it("derives text from a model that generates content", () => {
    const capabilities = deriveCapabilitiesFromProviderModel({
      id: "gemini-3.5-flash",
      label: "Gemini 3.5 Flash",
      supportedActions: ["generateContent", "generateContentStream", "countTokens"],
    });

    expect(valuesOf(capabilities)).toEqual(["text"]);
  });

  it("derives speech (not text) from a TTS model even though it generates content", () => {
    const capabilities = deriveCapabilitiesFromProviderModel({
      id: "gemini-2.5-flash-preview-tts",
      label: "Gemini 2.5 Flash Preview TTS",
      supportedActions: ["generateContent", "countTokens"],
    });

    expect(valuesOf(capabilities)).toEqual(["speech"]);
  });

  it("derives live from a model that supports bidirectional generation", () => {
    const capabilities = deriveCapabilitiesFromProviderModel({
      id: "gemini-2.5-flash-native-audio",
      label: "Gemini 2.5 Flash Native Audio",
      supportedActions: ["generateContent", "bidiGenerateContent"],
    });

    expect(valuesOf(capabilities)).toEqual(["text", "live"]);
  });

  it("derives image from an image-generation model", () => {
    const capabilities = deriveCapabilitiesFromProviderModel({
      id: "gemini-2.5-flash-image",
      label: "Gemini 2.5 Flash Image",
      supportedActions: ["generateContent"],
    });

    expect(valuesOf(capabilities)).toEqual(["text", "image"]);
  });

  it("derives video from a Veo model", () => {
    const capabilities = deriveCapabilitiesFromProviderModel({
      id: "veo-3.1-fast-generate-preview",
      label: "Veo 3.1 Fast",
      supportedActions: ["predictLongRunning"],
    });

    expect(valuesOf(capabilities)).toEqual(["video"]);
  });

  it("returns no capability when the model supports nothing we recognize", () => {
    const capabilities = deriveCapabilitiesFromProviderModel({
      id: "text-embedding-004",
      label: "Text Embedding 004",
      supportedActions: ["embedContent"],
    });

    expect(capabilities).toEqual([]);
  });
});
