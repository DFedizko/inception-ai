export class Title {
  private static readonly placeholderText = "New conversation";

  private constructor(private readonly value: string) {}

  static placeholder(): Title {
    return new Title(Title.placeholderText);
  }

  static of(value: string): Title {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new EmptyTitleError();
    }
    return new Title(trimmed);
  }

  isPlaceholder(): boolean {
    return this.value === Title.placeholderText;
  }

  equals(other: Title): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class EmptyTitleError extends Error {
  constructor() {
    super("A Title cannot be empty.");
    this.name = "EmptyTitleError";
  }
}
