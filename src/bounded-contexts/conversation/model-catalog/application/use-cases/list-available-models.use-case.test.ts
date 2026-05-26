import { describe, expect, it } from "bun:test";
import { FakeModelCatalogProvider } from "../../infrastructure/catalog/model-catalog-provider.fake";
import { ListAvailableModels } from "./list-available-models.use-case";

describe("ListAvailableModels", () => {
  it("maps provider models to domain models, hiding unusable ones and ordering by capability", async () => {
    const provider = new FakeModelCatalogProvider([
      {
        id: "gemini-2.5-flash-native-audio",
        label: "Native Audio",
        supportedActions: ["bidiGenerateContent"],
      },
      { id: "text-embedding-004", label: "Embedding", supportedActions: ["embedContent"] },
      { id: "gemini-2.5-flash-preview-tts", label: "TTS", supportedActions: ["generateContent"] },
      { id: "gemini-3.5-flash", label: "Flash", supportedActions: ["generateContent"] },
    ]);

    const models = await new ListAvailableModels(provider).execute();

    expect(models.map((model) => model.id)).toEqual([
      "gemini-3.5-flash",
      "gemini-2.5-flash-preview-tts",
      "gemini-2.5-flash-native-audio",
    ]);
    expect(models.map((model) => model.capabilityValues())).toEqual([["text"], ["speech"], ["live"]]);
  });

  it("returns an empty list when the provider has no models", async () => {
    const models = await new ListAvailableModels(new FakeModelCatalogProvider([])).execute();

    expect(models).toEqual([]);
  });

  it("propagates a provider failure", async () => {
    const provider = new FakeModelCatalogProvider([], new Error("provider down"));

    await expect(new ListAvailableModels(provider).execute()).rejects.toThrow("provider down");
  });
});
