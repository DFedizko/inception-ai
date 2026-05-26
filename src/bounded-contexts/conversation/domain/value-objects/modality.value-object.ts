export type ModalityValue = "text" | "voice";

export class Modality {
  private static readonly allowed: readonly ModalityValue[] = ["text", "voice"];

  private constructor(private readonly value: ModalityValue) {}

  static text(): Modality {
    return new Modality("text");
  }

  static voice(): Modality {
    return new Modality("voice");
  }

  static fromString(value: string): Modality {
    if (!Modality.allowed.includes(value as ModalityValue)) {
      throw new InvalidModalityError(value);
    }
    return new Modality(value as ModalityValue);
  }

  isText(): boolean {
    return this.value === "text";
  }

  isVoice(): boolean {
    return this.value === "voice";
  }

  equals(other: Modality): boolean {
    return this.value === other.value;
  }

  toString(): ModalityValue {
    return this.value;
  }
}

export class InvalidModalityError extends Error {
  constructor(value: string) {
    super(`Unsupported message modality: "${value}". Allowed: text, voice.`);
    this.name = "InvalidModalityError";
  }
}
