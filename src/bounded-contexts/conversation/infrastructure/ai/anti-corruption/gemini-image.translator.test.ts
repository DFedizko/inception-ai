import { describe, expect, it } from "bun:test";
import { extractGeneratedImage, MissingGeneratedImageError } from "./gemini-image.translator";

describe("extractGeneratedImage", () => {
  it("decodes the inline base64 image part into bytes and mime type", () => {
    const base64 = Buffer.from("hello").toString("base64");
    const image = extractGeneratedImage({
      candidates: [
        {
          content: {
            parts: [{ text: "here it is" }, { inlineData: { data: base64, mimeType: "image/png" } }],
          },
        },
      ],
    });

    expect(image.mimeType).toBe("image/png");
    expect(Buffer.from(image.data).toString()).toBe("hello");
  });

  it("defaults the mime type to png when absent", () => {
    const image = extractGeneratedImage({
      candidates: [{ content: { parts: [{ inlineData: { data: "QQ==" } }] } }],
    });

    expect(image.mimeType).toBe("image/png");
  });

  it("throws when the response carries no image data", () => {
    expect(() =>
      extractGeneratedImage({ candidates: [{ content: { parts: [{ text: "only text" }] } }] }),
    ).toThrow(MissingGeneratedImageError);
  });
});
