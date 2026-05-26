import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../../error-response";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (_request: Request, context: RouteContext): Promise<Response> => {
  const { id } = await context.params;
  try {
    return Response.json(await container.get(ConversationController).getConversation(id));
  } catch (error) {
    return errorResponse(error);
  }
};
