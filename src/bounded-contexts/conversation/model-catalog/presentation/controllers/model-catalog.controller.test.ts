import { describe, expect, it } from "bun:test";
import { ListAvailableModels } from "../../application/use-cases/list-available-models.use-case";
import { FakeModelCatalogProvider } from "../../infrastructure/catalog/model-catalog-provider.fake";
import { ModelCatalogController } from "./model-catalog.controller";

const buildController = (provider: FakeModelCatalogProvider) =>
  new ModelCatalogController(new ListAvailableModels(provider));

describe("ModelCatalogController", () => {
  it("shapes usable models under a models key matching the contract", async () => {
    const controller = buildController(
      new FakeModelCatalogProvider([
        { id: "gemini-2.5-flash", label: "Flash", supportedActions: ["generateContent"] },
        { id: "text-embedding-004", label: "Embedding", supportedActions: ["embedContent"] },
      ]),
    );

    const dto = await controller.listModels();

    expect(dto).toEqual({
      models: [{ id: "gemini-2.5-flash", label: "Flash", capabilities: ["text"], tier: "free" }],
    });
  });

  it("returns an empty catalog when nothing is usable", async () => {
    const controller = buildController(new FakeModelCatalogProvider([]));

    expect(await controller.listModels()).toEqual({ models: [] });
  });

  it("propagates a provider failure to the caller", async () => {
    const controller = buildController(
      new FakeModelCatalogProvider([], new Error("provider down")),
    );

    await expect(controller.listModels()).rejects.toThrow("provider down");
  });
});
