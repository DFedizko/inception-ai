export type Capability = "text" | "speech" | "live" | "image" | "video";

export type Tier = "free" | "paid" | "unknown";

export class AiModel {
  constructor(
    readonly id: string,
    readonly label: string,
    readonly capabilities: Capability[],
    readonly tier: Tier,
  ) {}

  supports(capability: Capability): boolean {
    return this.capabilities.includes(capability);
  }

  isLive(): boolean {
    return this.supports("live");
  }

  isTextCapable(): boolean {
    return this.supports("text");
  }

  canGenerateImage(): boolean {
    return this.supports("image");
  }

  canGenerateVideo(): boolean {
    return this.supports("video");
  }
}
