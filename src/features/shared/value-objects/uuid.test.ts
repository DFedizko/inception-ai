import { describe, expect, it } from "bun:test";

import { UUID } from "./uuid";

const valid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("UUID", () => {
  it("is created from a well-formed uuid string", () => {
    expect(UUID.create(valid).value).toBe(valid);
  });

  it("rejects a malformed value", () => {
    expect(() => UUID.create("not-a-uuid")).toThrow();
    expect(() => UUID.create("")).toThrow();
    expect(() => UUID.create(`${valid}-extra`)).toThrow();
  });

  it("compares by value, not by reference", () => {
    expect(UUID.create(valid).equals(UUID.create(valid))).toBe(true);
    expect(UUID.create(valid).equals(UUID.create(crypto.randomUUID()))).toBe(false);
  });

  it("renders back to its string value", () => {
    expect(UUID.create(valid).toString()).toBe(valid);
  });

  it("accepts uuids minted by the runtime", () => {
    const minted = crypto.randomUUID();
    expect(UUID.create(minted).value).toBe(minted);
  });
});
