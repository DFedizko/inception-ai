import { AiModel } from "../../model/ai-model.model";
import type { ModelCatalogGateway } from "./model-catalog.gateway";

const catalog: AiModel[] = [
  new AiModel("gemini-3.5-flash", "Gemini 3.5 Flash", ["text"], "free"),
  new AiModel("gemini-3.1-flash-live-preview", "Gemini 3.1 Flash Live", ["text", "live"], "free"),
  new AiModel("gemini-2.5-pro", "Gemini 2.5 Pro", ["text"], "paid"),
];

export class MockModelCatalogGateway implements ModelCatalogGateway {
  async listModels(): Promise<AiModel[]> {
    return catalog;
  }
}
