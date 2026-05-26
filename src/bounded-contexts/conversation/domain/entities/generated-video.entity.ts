import { VideoStatus } from "../value-objects/video-status.value-object";

type GeneratedVideoProps = {
  id: string;
  prompt: string;
  status: VideoStatus;
  uri?: string;
  failureReason?: string;
  createdAt: Date;
};

export class GeneratedVideo {
  readonly kind = "video" as const;

  private constructor(private readonly props: GeneratedVideoProps) {}

  static requested(prompt: string): GeneratedVideo {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) {
      throw new EmptyVideoPromptError();
    }
    return new GeneratedVideo({
      id: crypto.randomUUID(),
      prompt: trimmed,
      status: VideoStatus.pending(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: GeneratedVideoProps): GeneratedVideo {
    return new GeneratedVideo(props);
  }

  get id(): string {
    return this.props.id;
  }

  get prompt(): string {
    return this.props.prompt;
  }

  get status(): VideoStatus {
    return this.props.status;
  }

  get uri(): string | undefined {
    return this.props.uri;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  startGenerating(): void {
    this.transitionTo(VideoStatus.generating());
  }

  markReady(uri: string): void {
    if (uri.trim().length === 0) {
      throw new InvalidVideoTransitionError("A ready video requires a uri.");
    }
    this.transitionTo(VideoStatus.ready());
    this.props.uri = uri;
  }

  markFailed(reason: string): void {
    this.transitionTo(VideoStatus.failed());
    this.props.failureReason = reason;
  }

  private transitionTo(next: VideoStatus): void {
    if (!this.props.status.canTransitionTo(next)) {
      throw new InvalidVideoTransitionError(
        `Cannot move a video from "${this.props.status}" to "${next}".`,
      );
    }
    this.props.status = next;
  }
}

export class EmptyVideoPromptError extends Error {
  constructor() {
    super("A GeneratedVideo requires a non-empty prompt.");
    this.name = "EmptyVideoPromptError";
  }
}

export class InvalidVideoTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidVideoTransitionError";
  }
}
