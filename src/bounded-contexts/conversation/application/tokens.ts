export const TYPES = {
  ConversationRepository: Symbol.for("ConversationRepository"),
  ConversationSummaries: Symbol.for("ConversationSummaries"),
  AiProvider: Symbol.for("AiProvider"),
  LiveTokenProvider: Symbol.for("LiveTokenProvider"),
  ImageGenerator: Symbol.for("ImageGenerator"),
  VideoGenerator: Symbol.for("VideoGenerator"),
  Transcriber: Symbol.for("Transcriber"),
} as const;
