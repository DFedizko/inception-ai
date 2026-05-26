import { Container } from "inversify";
import type { ModelCatalogProvider, ProviderModel } from "./application/ports/model-catalog-provider";
import { TYPES } from "./application/tokens";
import { ListAvailableModels } from "./application/use-cases/list-available-models.use-case";
import { createGeminiModelCatalogProvider } from "./infrastructure/catalog/model-catalog-provider.gemini";
import { ModelCatalogController } from "./presentation/controllers/model-catalog.controller";

const catalog: ModelCatalogProvider = {
  listModels: (): Promise<ProviderModel[]> => createGeminiModelCatalogProvider().listModels(),
};

export const container = new Container();

container.bind<ModelCatalogProvider>(TYPES.ModelCatalogProvider).toConstantValue(catalog);
container.bind(ListAvailableModels).toSelf();
container.bind(ModelCatalogController).toSelf();
