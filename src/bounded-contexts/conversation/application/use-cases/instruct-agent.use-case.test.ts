import { describe, expect, it } from "bun:test";
import { Conversation } from "../../domain/aggregates/conversation.aggregate";
import { EmptyInstructionError } from "../../domain/value-objects/instruction.value-object";
import { InMemoryConversationRepository } from "../../infrastructure/repositories/conversation.repository.in-memory";
import { ConversationNotFoundError } from "../errors/conversation-not-found.error";
import { InstructAgent } from "./instruct-agent.use-case";

const setup = async () => {
  const repository = new InMemoryConversationRepository();
  const conversation = Conversation.start();
  await repository.save(conversation);
  return { repository, conversationId: conversation.id };
};

describe("InstructAgent", () => {
  it("assigns the instruction to the conversation's agent and persists it", async () => {
    const { repository, conversationId } = await setup();

    const conversation = await new InstructAgent(repository).execute({
      conversationId,
      instruction: "  Responda sempre em português  ",
    });

    expect(conversation.instructionText()).toBe("Responda sempre em português");
    const stored = await repository.findById(conversationId);
    expect(stored?.instructionText()).toBe("Responda sempre em português");
  });

  it("replaces a previously set instruction", async () => {
    const { repository, conversationId } = await setup();
    const useCase = new InstructAgent(repository);

    await useCase.execute({ conversationId, instruction: "seja formal" });
    const conversation = await useCase.execute({ conversationId, instruction: "seja informal" });

    expect(conversation.instructionText()).toBe("seja informal");
  });

  it("rejects an empty instruction", async () => {
    const { repository, conversationId } = await setup();

    await expect(
      new InstructAgent(repository).execute({ conversationId, instruction: "   " }),
    ).rejects.toBeInstanceOf(EmptyInstructionError);
  });

  it("rejects an unknown conversation", async () => {
    const { repository } = await setup();

    await expect(
      new InstructAgent(repository).execute({ conversationId: "missing", instruction: "oi" }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
