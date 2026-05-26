export type CapabilityValue = "text" | "speech" | "live" | "image" | "video";

export class Capability {
  static readonly text = new Capability("text", 0);
  static readonly speech = new Capability("speech", 1);
  static readonly live = new Capability("live", 2);
  static readonly image = new Capability("image", 3);
  static readonly video = new Capability("video", 4);

  private constructor(
    private readonly value: CapabilityValue,
    readonly rank: number,
  ) {}

  static fromString(value: string): Capability {
    switch (value) {
      case "text":
        return Capability.text;
      case "speech":
        return Capability.speech;
      case "live":
        return Capability.live;
      case "image":
        return Capability.image;
      case "video":
        return Capability.video;
      default:
        throw new UnknownCapabilityError(value);
    }
  }

  equals(other: Capability): boolean {
    return this.value === other.value;
  }

  toString(): CapabilityValue {
    return this.value;
  }
}

export class UnknownCapabilityError extends Error {
  constructor(value: string) {
    super(`Unknown capability: "${value}". Allowed: text, speech, live, image, video.`);
    this.name = "UnknownCapabilityError";
  }
}
