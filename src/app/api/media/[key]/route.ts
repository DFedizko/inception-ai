import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const directory = process.env.MEDIA_DIR ?? ".media";

const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
};

type RouteContext = { params: Promise<{ key: string }> };

export const GET = async (_request: Request, context: RouteContext): Promise<Response> => {
  const { key } = await context.params;
  if (!/^[\w-]+\.[a-z0-9]+$/i.test(key)) {
    return new Response(null, { status: 400 });
  }

  try {
    const data = await readFile(join(directory, key));
    const extension = key.split(".").pop() ?? "";
    return new Response(data, {
      headers: { "Content-Type": contentTypes[extension] ?? "application/octet-stream" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
