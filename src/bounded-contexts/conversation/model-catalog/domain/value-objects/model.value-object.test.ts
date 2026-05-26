import { describe, expect, it } from "bun:test";
import { Capability } from "./capability.value-object";
import { Model } from "./model.value-object";

describe("Model", () => {
  it("is unusable when it has no capability we support", () => {
    const model = Model.of({ id: "x", label: "X", capabilities: [], tier: "free" });

    expect(model.isUsable()).toBe(false);
  });

  it("is usable and reports the capabilities it supports", () => {
    const model = Model.of({ id: "x", label: "X", capabilities: [Capability.text], tier: "free" });

    expect(model.isUsable()).toBe(true);
    expect(model.supports(Capability.text)).toBe(true);
    expect(model.supports(Capability.live)).toBe(false);
  });

  it("exposes capability values ordered text, speech, live regardless of input order", () => {
    const model = Model.of({
      id: "x",
      label: "X",
      capabilities: [Capability.live, Capability.text, Capability.speech],
      tier: "free",
    });

    expect(model.capabilityValues()).toEqual(["text", "speech", "live"]);
  });

  it("ranks itself by its strongest (lowest-rank) capability", () => {
    const textModel = Model.of({ id: "t", label: "T", capabilities: [Capability.text], tier: "free" });
    const liveOnly = Model.of({ id: "l", label: "L", capabilities: [Capability.live], tier: "free" });

    expect(textModel.primaryRank()).toBeLessThan(liveOnly.primaryRank());
  });
});
