import type { HttpClient } from "@/features/shared/http/http-client";

import { AiModel, type Capability, type Tier } from "../../model/ai-model.model";
import type { ModelCatalogGateway } from "./model-catalog.gateway";

type ModelInfoDTO = { id: string; label: string; capabilities: Capability[]; tier: Tier };

export class HttpModelCatalogGateway implements ModelCatalogGateway {
  private readonly path = "/api/models";

  constructor(private readonly http: HttpClient) {}

  async listModels(): Promise<AiModel[]> {
    const { models } = await this.http.get<{ models: ModelInfoDTO[] }>(this.path);
    return models.map((dto) => this.toModel(dto));
  }

  private toModel(dto: ModelInfoDTO): AiModel {
    return new AiModel(dto.id, dto.label, dto.capabilities, dto.tier);
  }
}
