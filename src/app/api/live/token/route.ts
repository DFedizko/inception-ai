import { container } from "@/bounded-contexts/conversation/di";
import { ConversationController } from "@/bounded-contexts/conversation/presentation/controllers/conversation.controller";
import { errorResponse } from "../../error-response";

export const dynamic = "force-dynamic";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const { instruction } = await readInstruction(request);
    return Response.json(await container.get(ConversationController).issueLiveToken(instruction));
  } catch (error) {
    return errorResponse(error);
  }
};

const readInstruction = async (request: Request): Promise<{ instruction?: string | null }> => {
  try {
    const body = (await request.json()) as { instruction?: string | null };
    return { instruction: body.instruction ?? null };
  } catch {
    return { instruction: null };
  }
};
