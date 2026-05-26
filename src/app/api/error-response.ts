import { ConversationNotFoundError } from "@/bounded-contexts/conversation/application/errors/conversation-not-found.error";
import { ValidationError } from "@/bounded-contexts/shared/errors/validation.error";

export const errorResponse = (error: unknown): Response => {
  if (error instanceof ValidationError) {
    return Response.json(
      { error: { message: error.message, fields: error.issues } },
      { status: 400 },
    );
  }
  if (error instanceof ConversationNotFoundError) {
    return Response.json({ error: { message: error.message } }, { status: 404 });
  }
  return Response.json({ error: { message: "Something went wrong." } }, { status: 500 });
};
