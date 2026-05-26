import { describe, expect, it } from "bun:test";

import { peakLevel, rmsLevel } from "./audio-level";

describe("rmsLevel", () => {
  it("is zero for silence and for an empty frame", () => {
    expect(rmsLevel(new Float32Array(0))).toBe(0);
    expect(rmsLevel(Float32Array.from([0, 0, 0, 0]))).toBe(0);
  });

  it("grows with louder samples and never exceeds one", () => {
    const quiet = rmsLevel(Float32Array.from([0.02, -0.02, 0.02, -0.02]));
    const loud = rmsLevel(Float32Array.from([0.6, -0.6, 0.6, -0.6]));
    expect(loud).toBeGreaterThan(quiet);
    expect(rmsLevel(Float32Array.from([1, -1, 1, -1]))).toBeLessThanOrEqual(1);
  });
});

describe("peakLevel", () => {
  it("is zero for silence and for an empty frame", () => {
    expect(peakLevel(new Int16Array(0))).toBe(0);
    expect(peakLevel(Int16Array.from([0, 0, 0]))).toBe(0);
  });

  it("tracks the loudest absolute sample and never exceeds one", () => {
    const quiet = peakLevel(Int16Array.from([500, -300, 200]));
    const loud = peakLevel(Int16Array.from([20000, -100, 50]));
    expect(loud).toBeGreaterThan(quiet);
    expect(peakLevel(Int16Array.from([32767, -32768]))).toBeLessThanOrEqual(1);
  });
});
