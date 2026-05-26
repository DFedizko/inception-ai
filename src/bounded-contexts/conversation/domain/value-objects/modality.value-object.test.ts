import { describe, expect, it } from "bun:test";
import { InvalidModalityError, Modality } from "./modality.value-object";

describe("Modality", () => {
  it("builds the text channel", () => {
    expect(Modality.text().isText()).toBe(true);
    expect(Modality.text().toString()).toBe("text");
  });

  it("builds the voice channel", () => {
    expect(Modality.voice().isVoice()).toBe(true);
    expect(Modality.voice().toString()).toBe("voice");
  });

  it("parses a valid value from a string", () => {
    expect(Modality.fromString("text").equals(Modality.text())).toBe(true);
    expect(Modality.fromString("voice").equals(Modality.voice())).toBe(true);
  });

  it("rejects an unsupported value", () => {
    expect(() => Modality.fromString("image")).toThrow(InvalidModalityError);
  });
});
