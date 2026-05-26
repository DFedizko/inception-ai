export type StoredMedia = { url: string };

export interface MediaStorage {
  store(data: Uint8Array, mimeType: string): Promise<StoredMedia>;
}
