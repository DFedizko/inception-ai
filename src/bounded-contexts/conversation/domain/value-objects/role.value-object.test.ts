import { describe, expect, it } from "bun:test";
import { InvalidRoleError, Role } from "./role.value-object";

describe("Role", () => {
  it("distinguishes user from assistant", () => {
    expect(Role.user().isUser()).toBe(true);
    expect(Role.user().isAssistant()).toBe(false);
    expect(Role.assistant().isAssistant()).toBe(true);
  });

  it("parses a valid value from a string", () => {
    expect(Role.fromString("user").equals(Role.user())).toBe(true);
    expect(Role.fromString("assistant").equals(Role.assistant())).toBe(true);
  });

  it("rejects an unsupported value", () => {
    expect(() => Role.fromString("system")).toThrow(InvalidRoleError);
  });
});
