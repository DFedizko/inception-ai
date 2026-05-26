import { describe, expect, it } from "bun:test";
import { AudioContent, InvalidAudioContentError } from "./audio-content.value-object";

const validProps = { uri: "blob://a", mimeType: "audio/mp3", durationMs: 1200 };

describe("AudioContent", () => {
  it("carries its location, mime type and duration", () => {
    const content = AudioContent.of(validProps);

    expect(content.kind).toBe("audio");
    expect(content.uri).toBe("blob://a");
    expect(content.mimeType).toBe("audio/mp3");
    expect(content.durationMs).toBe(1200);
  });

  it("rejects a missing uri", () => {
    expect(() => AudioContent.of({ ...validProps, uri: " " })).toThrow(InvalidAudioContentError);
  });

  it("rejects a non-positive duration", () => {
    expect(() => AudioContent.of({ ...validProps, durationMs: 0 })).toThrow(InvalidAudioContentError);
  });
});
