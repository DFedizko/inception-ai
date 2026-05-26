import type { ImageGenerator } from "../../application/ports/image-generator";
import { ImageContent } from "../../domain/value-objects/image-content.value-object";

type FakeImageGeneratorOptions = {
  image?: ImageContent;
  failsWith?: Error;
};

export class FakeImageGenerator implements ImageGenerator {
  receivedPrompt?: string;
  private readonly image: ImageContent;
  private readonly failsWith?: Error;

  constructor(options: FakeImageGeneratorOptions = {}) {
    this.image =
      options.image ??
      ImageContent.of({ uri: "blob://generated.png", mimeType: "image/png", width: 1024, height: 1024 });
    this.failsWith = options.failsWith;
  }

  async generate(prompt: string): Promise<ImageContent> {
    this.receivedPrompt = prompt;
    if (this.failsWith) {
      throw this.failsWith;
    }
    return this.image;
  }
}
