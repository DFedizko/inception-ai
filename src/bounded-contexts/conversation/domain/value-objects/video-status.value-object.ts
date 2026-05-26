export type VideoStatusValue = "pending" | "generating" | "ready" | "failed";

const transitions: Record<VideoStatusValue, readonly VideoStatusValue[]> = {
  pending: ["generating"],
  generating: ["ready", "failed"],
  ready: [],
  failed: [],
};

export class VideoStatus {
  private constructor(private readonly value: VideoStatusValue) {}

  static pending(): VideoStatus {
    return new VideoStatus("pending");
  }

  static generating(): VideoStatus {
    return new VideoStatus("generating");
  }

  static ready(): VideoStatus {
    return new VideoStatus("ready");
  }

  static failed(): VideoStatus {
    return new VideoStatus("failed");
  }

  static fromString(value: string): VideoStatus {
    if (!(value in transitions)) {
      throw new InvalidVideoStatusError(value);
    }
    return new VideoStatus(value as VideoStatusValue);
  }

  canTransitionTo(next: VideoStatus): boolean {
    return transitions[this.value].includes(next.value);
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isGenerating(): boolean {
    return this.value === "generating";
  }

  isReady(): boolean {
    return this.value === "ready";
  }

  isFailed(): boolean {
    return this.value === "failed";
  }

  equals(other: VideoStatus): boolean {
    return this.value === other.value;
  }

  toString(): VideoStatusValue {
    return this.value;
  }
}

export class InvalidVideoStatusError extends Error {
  constructor(value: string) {
    super(`Unsupported video status: "${value}".`);
    this.name = "InvalidVideoStatusError";
  }
}
