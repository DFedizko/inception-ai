import { describe, expect, it } from "bun:test";
import { EmptyTitleError, Title } from "./title.value-object";

describe("Title", () => {
  it("offers a placeholder for conversations without messages", () => {
    expect(Title.placeholder().isPlaceholder()).toBe(true);
    expect(Title.placeholder().toString()).toBe("New conversation");
  });

  it("trims surrounding whitespace from a derived title", () => {
    expect(Title.of("  Hello there  ").toString()).toBe("Hello there");
  });

  it("rejects an empty or whitespace-only title", () => {
    expect(() => Title.of("   ")).toThrow(EmptyTitleError);
  });
});
