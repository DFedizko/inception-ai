import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { streamingTextResponse } from "../../../streaming-response";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: RouteContext): Promise<Response> => {
  const { id } = await context.params;
  const body = await readJson(request);
  const controller = container.get(ConversationController);

  return streamingTextResponse((onChunk) => controller.sendMessage(id, body, onChunk));
};

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};
