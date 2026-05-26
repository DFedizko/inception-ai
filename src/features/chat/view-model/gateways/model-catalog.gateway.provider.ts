import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";

import type { ModelCatalogGateway } from "./model-catalog.gateway";
import { HttpModelCatalogGateway } from "./model-catalog.http.gateway";

let gateway: ModelCatalogGateway = new HttpModelCatalogGateway(new FetchHttpClient());

export const modelCatalogGateway = (): ModelCatalogGateway => gateway;

export const setModelCatalogGateway = (next: ModelCatalogGateway): void => {
  gateway = next;
};
