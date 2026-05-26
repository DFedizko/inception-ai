import type { ImageContent } from "../../domain/value-objects/image-content.value-object";

export interface ImageGenerator {
  generate(prompt: string): Promise<ImageContent>;
}
