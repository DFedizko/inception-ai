const MAX_LENGTH = 8000;

export class Instruction {
  private constructor(private readonly value: string) {}

  static of(value: string): Instruction {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new EmptyInstructionError();
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new InstructionTooLongError(trimmed.length);
    }
    return new Instruction(trimmed);
  }

  equals(other: Instruction): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class EmptyInstructionError extends Error {
  constructor() {
    super("An agent instruction must not be empty.");
    this.name = "EmptyInstructionError";
  }
}

export class InstructionTooLongError extends Error {
  constructor(length: number) {
    super(`An agent instruction must be at most ${MAX_LENGTH} characters (got ${length}).`);
    this.name = "InstructionTooLongError";
  }
}
