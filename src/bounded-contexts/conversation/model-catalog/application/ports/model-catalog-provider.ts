export type ProviderModel = {
  id: string;
  label: string;
  supportedActions: string[];
};

export interface ModelCatalogProvider {
  listModels(): Promise<ProviderModel[]>;
}
