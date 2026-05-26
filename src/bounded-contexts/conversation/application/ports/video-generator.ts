export type VideoGenerationOutcome =
  | { status: "ready"; uri: string }
  | { status: "failed"; reason: string };

export interface VideoGenerator {
  generate(prompt: string): Promise<VideoGenerationOutcome>;
}
