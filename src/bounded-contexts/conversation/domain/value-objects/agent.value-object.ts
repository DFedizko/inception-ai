import { Instruction } from "./instruction.value-object";

export class Agent {
  private constructor(private readonly instructionValue: Instruction | null) {}

  static withoutInstruction(): Agent {
    return new Agent(null);
  }

  static instructedBy(instruction: Instruction): Agent {
    return new Agent(instruction);
  }

  hasInstruction(): boolean {
    return this.instructionValue !== null;
  }

  get instruction(): Instruction | null {
    return this.instructionValue;
  }

  instructionText(): string | null {
    return this.instructionValue?.toString() ?? null;
  }

  equals(other: Agent): boolean {
    if (this.instructionValue === null || other.instructionValue === null) {
      return this.instructionValue === other.instructionValue;
    }
    return this.instructionValue.equals(other.instructionValue);
  }
}
