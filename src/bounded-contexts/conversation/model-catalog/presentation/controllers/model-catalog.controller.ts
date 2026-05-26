import { inject, injectable } from "inversify";
import { ListAvailableModels } from "../../application/use-cases/list-available-models.use-case";
import { modelCatalogSchema, type ModelCatalogDTO } from "../dto/model-info.dto";
import { toModelInfoDTO } from "../mappers/model.mapper";

@injectable()
export class ModelCatalogController {
  constructor(
    @inject(ListAvailableModels)
    private readonly listAvailableModelsUseCase: ListAvailableModels,
  ) {}

  async listModels(): Promise<ModelCatalogDTO> {
    const models = await this.listAvailableModelsUseCase.execute();
    return modelCatalogSchema.parse({ models: models.map(toModelInfoDTO) });
  }
}
