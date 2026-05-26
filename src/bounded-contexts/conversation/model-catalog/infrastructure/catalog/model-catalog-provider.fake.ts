import type {
  ModelCatalogProvider,
  ProviderModel,
} from "../../application/ports/model-catalog-provider";

export class FakeModelCatalogProvider implements ModelCatalogProvider {
  constructor(
    private readonly models: ProviderModel[] = [],
    private readonly failure?: Error,
  ) {}

  async listModels(): Promise<ProviderModel[]> {
    if (this.failure) {
      throw this.failure;
    }
    return this.models;
  }
}
