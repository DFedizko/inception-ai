import { describe, expect, it } from "bun:test";
import { Capability, UnknownCapabilityError } from "./capability.value-object";

describe("Capability", () => {
  it("resolves each known value to its shared instance", () => {
    expect(Capability.fromString("text")).toBe(Capability.text);
    expect(Capability.fromString("speech")).toBe(Capability.speech);
    expect(Capability.fromString("live")).toBe(Capability.live);
  });

  it("rejects an unknown value", () => {
    expect(() => Capability.fromString("vision")).toThrow(UnknownCapabilityError);
  });

  it("ranks text before speech before live", () => {
    expect(Capability.text.rank).toBeLessThan(Capability.speech.rank);
    expect(Capability.speech.rank).toBeLessThan(Capability.live.rank);
  });

  it("compares by value", () => {
    expect(Capability.text.equals(Capability.fromString("text"))).toBe(true);
    expect(Capability.text.equals(Capability.live)).toBe(false);
  });
});
