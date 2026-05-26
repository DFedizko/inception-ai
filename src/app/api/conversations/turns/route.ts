import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../../error-response";

export const dynamic = "force-dynamic";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const conversation = await container
      .get(ConversationController)
      .beginConversationWithTurns(body);
    return Response.json(conversation, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
};
