import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "bun:test";
import { FilesystemMediaStorage } from "./media-storage.filesystem";

const directory = join(tmpdir(), `media-storage-test-${crypto.randomUUID()}`);

afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("FilesystemMediaStorage", () => {
  it("writes the bytes and returns a public url with the right extension", async () => {
    const storage = new FilesystemMediaStorage(directory, "/api/media");
    const data = new Uint8Array([1, 2, 3, 4]);

    const { url } = await storage.store(data, "image/png");

    expect(url).toMatch(/^\/api\/media\/[\w-]+\.png$/);
    const key = url.replace("/api/media/", "");
    expect(new Uint8Array(await readFile(join(directory, key)))).toEqual(data);
  });
});
