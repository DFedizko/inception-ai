import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../error-response";
import { streamingTextResponse } from "../streaming-response";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<Response> => {
  try {
    return Response.json(await container.get(ConversationController).listConversations());
  } catch (error) {
    return errorResponse(error);
  }
};

export const POST = async (request: Request): Promise<Response> => {
  const body = await readJson(request);
  const controller = container.get(ConversationController);
  const headers: Record<string, string> = {};

  return streamingTextResponse(
    (onChunk) =>
      controller.beginConversation(body, onChunk, (conversationId) => {
        headers["x-conversation-id"] = conversationId;
      }),
    headers,
  );
};

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};
