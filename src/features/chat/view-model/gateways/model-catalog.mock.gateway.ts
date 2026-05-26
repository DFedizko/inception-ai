import type { AiModel } from "../../model/ai-model.model";
import type { ModelCatalogGateway } from "./model-catalog.gateway";

const catalog: AiModel[] = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", capabilities: ["text"], tier: "free" },
  {
    id: "gemini-3.1-flash-live-preview",
    label: "Gemini 3.1 Flash Live",
    capabilities: ["text", "live"],
    tier: "free",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    capabilities: ["text"],
    tier: "paid",
  },
];

export class MockModelCatalogGateway implements ModelCatalogGateway {
  async listModels(): Promise<AiModel[]> {
    return catalog;
  }
}
