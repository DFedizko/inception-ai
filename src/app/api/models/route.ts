import { container } from "@/bounded-contexts/conversation/model-catalog/di";
import { ModelCatalogController } from "@/bounded-contexts/conversation/model-catalog/presentation/controllers/model-catalog.controller";
import { errorResponse } from "../error-response";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<Response> => {
  try {
    return Response.json(await container.get(ModelCatalogController).listModels());
  } catch (error) {
    return errorResponse(error);
  }
};
