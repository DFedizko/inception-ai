import { describe, expect, it } from "bun:test";

import { Agent } from "./agent.value-object";
import { Instruction } from "./instruction.value-object";

describe("Agent", () => {
  it("starts without an instruction", () => {
    const agent = Agent.withoutInstruction();
    expect(agent.hasInstruction()).toBe(false);
    expect(agent.instructionText()).toBeNull();
  });

  it("carries the instruction it was given", () => {
    const agent = Agent.instructedBy(Instruction.of("seja conciso"));
    expect(agent.hasInstruction()).toBe(true);
    expect(agent.instructionText()).toBe("seja conciso");
  });

  it("compares by instruction value", () => {
    expect(Agent.withoutInstruction().equals(Agent.withoutInstruction())).toBe(true);
    expect(
      Agent.instructedBy(Instruction.of("x")).equals(Agent.instructedBy(Instruction.of("x"))),
    ).toBe(true);
    expect(Agent.withoutInstruction().equals(Agent.instructedBy(Instruction.of("x")))).toBe(false);
  });
});
