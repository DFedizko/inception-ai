import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MediaStorage, StoredMedia } from "./media-storage";

const extensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
};

export const extensionFor = (mimeType: string): string => extensions[mimeType] ?? "bin";

export class FilesystemMediaStorage implements MediaStorage {
  constructor(
    private readonly directory: string,
    private readonly publicPath: string = "/api/media",
  ) {}

  async store(data: Uint8Array, mimeType: string): Promise<StoredMedia> {
    await mkdir(this.directory, { recursive: true });
    const key = `${crypto.randomUUID()}.${extensionFor(mimeType)}`;
    await writeFile(join(this.directory, key), data);
    return { url: `${this.publicPath}/${key}` };
  }
}

export const createFilesystemMediaStorage = (): FilesystemMediaStorage =>
  new FilesystemMediaStorage(process.env.MEDIA_DIR ?? ".media");
