import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../../error-response";

export const dynamic = "force-dynamic";

export const POST = async (): Promise<Response> => {
  try {
    return Response.json(await container.get(ConversationController).issueLiveToken());
  } catch (error) {
    return errorResponse(error);
  }
};
