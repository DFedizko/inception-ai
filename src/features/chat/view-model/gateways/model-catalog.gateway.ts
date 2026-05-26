import type { AiModel } from "../../model/ai-model.model";

export interface ModelCatalogGateway {
  listModels(): Promise<AiModel[]>;
}
