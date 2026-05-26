import { describe, expect, it } from "bun:test";
import { GeminiModelCatalogProvider, type GeminiModelsClient } from "./model-catalog-provider.gemini";

const pageOf = async function* <T>(descriptors: T[]) {
  for (const descriptor of descriptors) {
    yield descriptor;
  }
};

describe("GeminiModelCatalogProvider", () => {
  it("strips the resource prefix, prefers the display name, and defaults actions", async () => {
    const client: GeminiModelsClient = {
      models: {
        list: async () =>
          pageOf([
            {
              name: "models/gemini-3.5-flash",
              displayName: "Gemini 3.5 Flash",
              supportedActions: ["generateContent"],
            },
            { name: "models/gemini-2.5-flash-preview-tts" },
          ]),
      },
    };

    const models = await new GeminiModelCatalogProvider(client).listModels();

    expect(models).toEqual([
      {
        id: "gemini-3.5-flash",
        label: "Gemini 3.5 Flash",
        supportedActions: ["generateContent"],
      },
      {
        id: "gemini-2.5-flash-preview-tts",
        label: "gemini-2.5-flash-preview-tts",
        supportedActions: [],
      },
    ]);
  });

  it("returns an empty list when the provider yields no models", async () => {
    const client: GeminiModelsClient = { models: { list: async () => pageOf([]) } };

    expect(await new GeminiModelCatalogProvider(client).listModels()).toEqual([]);
  });
});
