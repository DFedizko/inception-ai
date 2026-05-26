import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../../error-response";

export const dynamic = "force-dynamic";

export const POST = async (request: Request): Promise<Response> => {
  const body = await readJson(request);
  try {
    return Response.json(await container.get(ConversationController).generateVideo(undefined, body));
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
