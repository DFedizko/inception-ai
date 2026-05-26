import { describe, expect, it } from "bun:test";
import { ImageContent, InvalidImageContentError } from "./image-content.value-object";

const validProps = { uri: "blob://img", mimeType: "image/png", width: 1024, height: 1024 };

describe("ImageContent", () => {
  it("carries its location, mime type and dimensions", () => {
    const content = ImageContent.of(validProps);

    expect(content.kind).toBe("image");
    expect(content.uri).toBe("blob://img");
    expect(content.width).toBe(1024);
    expect(content.height).toBe(1024);
  });

  it("rejects a missing mime type", () => {
    expect(() => ImageContent.of({ ...validProps, mimeType: "" })).toThrow(InvalidImageContentError);
  });

  it("rejects non-positive dimensions", () => {
    expect(() => ImageContent.of({ ...validProps, height: 0 })).toThrow(InvalidImageContentError);
  });

  it("allows omitting dimensions when the provider does not report them", () => {
    const content = ImageContent.of({ uri: "data:image/png;base64,AAAA", mimeType: "image/png" });

    expect(content.width).toBeUndefined();
    expect(content.height).toBeUndefined();
  });
});
