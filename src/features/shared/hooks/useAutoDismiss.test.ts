import { describe, expect, it } from "bun:test";

import { remainingAfterPause } from "./useAutoDismiss";

describe("remainingAfterPause", () => {
  it("subtracts the elapsed run time from the remaining time", () => {
    expect(remainingAfterPause(4000, 1000, 2500)).toBe(2500);
  });

  it("never returns a negative remainder", () => {
    expect(remainingAfterPause(4000, 1000, 9000)).toBe(0);
  });

  it("keeps the full remainder when no time elapsed", () => {
    expect(remainingAfterPause(4000, 5000, 5000)).toBe(4000);
  });
});
