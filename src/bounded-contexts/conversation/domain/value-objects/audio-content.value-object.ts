type AudioContentProps = {
  uri: string;
  mimeType: string;
  durationMs: number;
};

export class AudioContent {
  readonly kind = "audio" as const;

  private constructor(private readonly props: AudioContentProps) {}

  static of(props: AudioContentProps): AudioContent {
    if (props.uri.trim().length === 0) {
      throw new InvalidAudioContentError("uri is required.");
    }
    if (props.mimeType.trim().length === 0) {
      throw new InvalidAudioContentError("mimeType is required.");
    }
    if (props.durationMs <= 0) {
      throw new InvalidAudioContentError("durationMs must be positive.");
    }
    return new AudioContent(props);
  }

  get uri(): string {
    return this.props.uri;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get durationMs(): number {
    return this.props.durationMs;
  }
}

export class InvalidAudioContentError extends Error {
  constructor(reason: string) {
    super(`Invalid AudioContent: ${reason}`);
    this.name = "InvalidAudioContentError";
  }
}
