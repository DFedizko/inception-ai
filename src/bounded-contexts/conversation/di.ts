import { Container } from "inversify";
import type { Turn } from "./domain/aggregates/conversation.aggregate";
import type { AiProvider, ReplyChunkListener } from "./application/ports/ai-provider";
import type { ImageGenerator } from "./application/ports/image-generator";
import type { LiveToken, LiveTokenProvider } from "./application/ports/live-token-provider";
import type { Transcriber } from "./application/ports/transcriber";
import type { VideoGenerator } from "./application/ports/video-generator";
import { TYPES } from "./application/tokens";
import { BeginConversation } from "./application/use-cases/begin-conversation.use-case";
import { BeginConversationWithTurns } from "./application/use-cases/begin-conversation-with-turns.use-case";
import { GenerateImage } from "./application/use-cases/generate-image.use-case";
import { GenerateImageFromVoice } from "./application/use-cases/generate-image-from-voice.use-case";
import { GenerateVideo } from "./application/use-cases/generate-video.use-case";
import { GetConversation } from "./application/use-cases/get-conversation.use-case";
import { InstructAgent } from "./application/use-cases/instruct-agent.use-case";
import { IssueLiveToken } from "./application/use-cases/issue-live-token.use-case";
import { ListConversations } from "./application/use-cases/list-conversations.use-case";
import { RecordTurns } from "./application/use-cases/record-turns.use-case";
import { SendMessage } from "./application/use-cases/send-message.use-case";
import { createGeminiAiProvider } from "./infrastructure/ai/ai-provider.gemini";
import { createGeminiImageGenerator } from "./infrastructure/ai/image-generator.gemini";
import { createGeminiLiveTokenProvider } from "./infrastructure/ai/live-token-provider.gemini";
import { createGeminiTranscriber } from "./infrastructure/ai/transcriber.gemini";
import { createGeminiVideoGenerator } from "./infrastructure/ai/video-generator.gemini";
import { createPrismaClient } from "./infrastructure/persistence/prisma-client";
import { ConversationSummariesDaoPrisma } from "./infrastructure/repositories/conversation-summaries.dao.prisma";
import { ConversationRepositoryPrisma } from "./infrastructure/repositories/conversation.repository.prisma";
import { ConversationController } from "./presentation/controllers/conversation.controller";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set — see .env.example.");
}
const prisma = createPrismaClient(databaseUrl);

const gemini: AiProvider = {
  streamReply: (history: Turn[], onChunk: ReplyChunkListener, instruction?: string | null) =>
    createGeminiAiProvider().streamReply(history, onChunk, instruction),
};

const geminiLiveTokens: LiveTokenProvider = {
  mint: (): Promise<LiveToken> => createGeminiLiveTokenProvider().mint(),
};

const geminiImages: ImageGenerator = {
  generate: (prompt: string) => createGeminiImageGenerator().generate(prompt),
};

const geminiVideos: VideoGenerator = {
  generate: (prompt: string) => createGeminiVideoGenerator().generate(prompt),
};

const geminiTranscriber: Transcriber = {
  transcribe: (audio) => createGeminiTranscriber().transcribe(audio),
};

export const container = new Container();

container
  .bind(TYPES.ConversationRepository)
  .toConstantValue(new ConversationRepositoryPrisma(prisma));
container
  .bind(TYPES.ConversationSummaries)
  .toConstantValue(new ConversationSummariesDaoPrisma(prisma));
container.bind<AiProvider>(TYPES.AiProvider).toConstantValue(gemini);
container.bind<LiveTokenProvider>(TYPES.LiveTokenProvider).toConstantValue(geminiLiveTokens);
container.bind<ImageGenerator>(TYPES.ImageGenerator).toConstantValue(geminiImages);
container.bind<VideoGenerator>(TYPES.VideoGenerator).toConstantValue(geminiVideos);
container.bind<Transcriber>(TYPES.Transcriber).toConstantValue(geminiTranscriber);
container.bind(BeginConversation).toSelf();
container.bind(BeginConversationWithTurns).toSelf();
container.bind(ListConversations).toSelf();
container.bind(GetConversation).toSelf();
container.bind(SendMessage).toSelf();
container.bind(IssueLiveToken).toSelf();
container.bind(RecordTurns).toSelf();
container.bind(InstructAgent).toSelf();
container.bind(GenerateImage).toSelf();
container.bind(GenerateImageFromVoice).toSelf();
container.bind(GenerateVideo).toSelf();
container.bind(ConversationController).toSelf();
