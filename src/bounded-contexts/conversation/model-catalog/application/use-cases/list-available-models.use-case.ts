import { inject, injectable } from "inversify";
import { deriveCapabilitiesFromProviderModel } from "../../domain/policies/capabilities-from-provider-model.policy";
import { deriveTierFromModelId } from "../../domain/policies/tier-from-model.policy";
import { Model } from "../../domain/value-objects/model.value-object";
import type { ModelCatalogProvider } from "../ports/model-catalog-provider";
import { TYPES } from "../tokens";

@injectable()
export class ListAvailableModels {
  constructor(
    @inject(TYPES.ModelCatalogProvider)
    private readonly catalog: ModelCatalogProvider,
  ) {}

  async execute(): Promise<Model[]> {
    const providerModels = await this.catalog.listModels();

    return providerModels
      .map((providerModel) =>
        Model.of({
          id: providerModel.id,
          label: providerModel.label,
          capabilities: deriveCapabilitiesFromProviderModel(providerModel),
          tier: deriveTierFromModelId(providerModel.id),
        }),
      )
      .filter((model) => model.isUsable())
      .sort((first, second) => first.primaryRank() - second.primaryRank());
  }
}
