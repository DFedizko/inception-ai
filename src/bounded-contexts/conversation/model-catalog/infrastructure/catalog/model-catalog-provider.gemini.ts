import { GoogleGenAI } from "@google/genai";
import type {
  ModelCatalogProvider,
  ProviderModel,
} from "../../application/ports/model-catalog-provider";

type ProviderModelDescriptor = {
  name?: string;
  displayName?: string;
  supportedActions?: string[];
};

export interface GeminiModelsClient {
  models: {
    list(): Promise<AsyncIterable<ProviderModelDescriptor>>;
  };
}

export class GeminiModelCatalogProvider implements ModelCatalogProvider {
  constructor(private readonly client: GeminiModelsClient) {}

  async listModels(): Promise<ProviderModel[]> {
    const page = await this.client.models.list();
    const models: ProviderModel[] = [];
    for await (const descriptor of page) {
      models.push(this.toProviderModel(descriptor));
    }
    return models;
  }

  private toProviderModel(descriptor: ProviderModelDescriptor): ProviderModel {
    const id = (descriptor.name ?? "").replace(/^models\//, "");
    return {
      id,
      label: descriptor.displayName ?? id,
      supportedActions: descriptor.supportedActions ?? [],
    };
  }
}

export const createGeminiModelCatalogProvider = (): GeminiModelCatalogProvider => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GeminiModelCatalogProvider(new GoogleGenAI({ apiKey }));
};
