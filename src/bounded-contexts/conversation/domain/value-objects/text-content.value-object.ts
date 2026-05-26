export class TextContent {
  readonly kind = "text" as const;

  private constructor(private readonly value: string) {}

  static of(value: string): TextContent {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new EmptyTextContentError();
    }
    return new TextContent(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TextContent): boolean {
    return this.value === other.value;
  }
}

export class EmptyTextContentError extends Error {
  constructor() {
    super("TextContent cannot be empty.");
    this.name = "EmptyTextContentError";
  }
}
