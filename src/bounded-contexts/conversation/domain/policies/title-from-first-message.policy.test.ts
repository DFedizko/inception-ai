import { describe, expect, it } from "bun:test";
import { deriveTitleFromFirstMessage } from "./title-from-first-message.policy";

describe("deriveTitleFromFirstMessage", () => {
  it("uses a short message verbatim", () => {
    expect(deriveTitleFromFirstMessage("How do I cook rice?").toString()).toBe(
      "How do I cook rice?",
    );
  });

  it("collapses internal whitespace and trims", () => {
    expect(deriveTitleFromFirstMessage("  Hello   world  ").toString()).toBe("Hello world");
  });

  it("truncates a long message at a word boundary with an ellipsis", () => {
    const longMessage =
      "Please explain in great detail how the photosynthesis process works for plants";
    const title = deriveTitleFromFirstMessage(longMessage).toString();

    expect(title.length).toBeLessThanOrEqual(51);
    expect(title.endsWith("…")).toBe(true);
    expect(title).toBe("Please explain in great detail how the…");
    expect(longMessage.startsWith(title.replace("…", "").trimEnd())).toBe(true);
  });

  it("truncates a single very long word without leaving it empty", () => {
    const oneWord = "x".repeat(120);
    const title = deriveTitleFromFirstMessage(oneWord).toString();

    expect(title).toBe(`${"x".repeat(50)}…`);
  });
});
