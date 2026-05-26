import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../../../../error-response";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  const { id } = await context.params;
  const body = await readJson(request);
  try {
    return Response.json(await container.get(ConversationController).generateImageFromVoice(id, body));
  } catch (error) {
    return errorResponse(error);
  }
};

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};
