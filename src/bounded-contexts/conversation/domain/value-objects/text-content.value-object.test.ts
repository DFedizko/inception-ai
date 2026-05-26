import { describe, expect, it } from "bun:test";
import { EmptyTextContentError, TextContent } from "./text-content.value-object";

describe("TextContent", () => {
  it("carries its text and trims surrounding whitespace", () => {
    const content = TextContent.of("  hello  ");

    expect(content.kind).toBe("text");
    expect(content.toString()).toBe("hello");
  });

  it("compares by value", () => {
    expect(TextContent.of("hi").equals(TextContent.of("hi"))).toBe(true);
    expect(TextContent.of("hi").equals(TextContent.of("bye"))).toBe(false);
  });

  it("rejects empty or whitespace-only text", () => {
    expect(() => TextContent.of("   ")).toThrow(EmptyTextContentError);
  });
});
