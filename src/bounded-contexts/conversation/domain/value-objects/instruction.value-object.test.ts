import { describe, expect, it } from "bun:test";

import {
  EmptyInstructionError,
  Instruction,
  InstructionTooLongError,
} from "./instruction.value-object";

describe("Instruction", () => {
  it("keeps the trimmed text it is built from", () => {
    expect(Instruction.of("  Fale como um pirata  ").toString()).toBe("Fale como um pirata");
  });

  it("rejects an empty or whitespace-only instruction", () => {
    expect(() => Instruction.of("")).toThrow(EmptyInstructionError);
    expect(() => Instruction.of("   ")).toThrow(EmptyInstructionError);
  });

  it("rejects an instruction longer than the allowed limit", () => {
    expect(() => Instruction.of("a".repeat(8001))).toThrow(InstructionTooLongError);
    expect(Instruction.of("a".repeat(8000)).toString()).toHaveLength(8000);
  });

  it("compares by value", () => {
    expect(Instruction.of("seja gentil").equals(Instruction.of("seja gentil"))).toBe(true);
    expect(Instruction.of("seja gentil").equals(Instruction.of("seja firme"))).toBe(false);
  });
});
