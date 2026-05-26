import type {
  VideoGenerationOutcome,
  VideoGenerator,
} from "../../application/ports/video-generator";

type FakeVideoGeneratorOptions = {
  outcome?: VideoGenerationOutcome;
};

export class FakeVideoGenerator implements VideoGenerator {
  receivedPrompt?: string;
  private readonly outcome: VideoGenerationOutcome;

  constructor(options: FakeVideoGeneratorOptions = {}) {
    this.outcome = options.outcome ?? { status: "ready", uri: "blob://generated.mp4" };
  }

  async generate(prompt: string): Promise<VideoGenerationOutcome> {
    this.receivedPrompt = prompt;
    return this.outcome;
  }
}
