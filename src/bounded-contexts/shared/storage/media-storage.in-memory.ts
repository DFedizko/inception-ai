import type { MediaStorage, StoredMedia } from "./media-storage";

export class InMemoryMediaStorage implements MediaStorage {
  readonly stored: { data: Uint8Array; mimeType: string }[] = [];

  async store(data: Uint8Array, mimeType: string): Promise<StoredMedia> {
    this.stored.push({ data, mimeType });
    return { url: `memory://${this.stored.length - 1}` };
  }
}
