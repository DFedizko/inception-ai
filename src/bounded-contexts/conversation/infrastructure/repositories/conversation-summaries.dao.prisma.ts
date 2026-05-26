import type { PrismaClient } from "@/generated/prisma/client";
import type {
  ConversationSummaries,
  ConversationSummary,
} from "../../application/ports/conversation-summaries";

export class ConversationSummariesDaoPrisma implements ConversationSummaries {
  constructor(private readonly prisma: PrismaClient) {}

  async listNewestFirst(): Promise<ConversationSummary[]> {
    const rows = await this.prisma.conversation.findMany({
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
    }));
  }
}
