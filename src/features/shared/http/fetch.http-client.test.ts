import { afterEach, describe, expect, it } from "bun:test";

import { HttpError } from "./http-client";
import { FetchHttpClient } from "./fetch.http-client";

type FetchArgs = { url: string; init: RequestInit };

const originalFetch = globalThis.fetch;

const stubFetch = (handler: (args: FetchArgs) => Response | Promise<Response>) => {
  const calls: FetchArgs[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const args = { url: String(input), init: init ?? {} };
    calls.push(args);
    return handler(args);
  }) as typeof fetch;
  return calls;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const streamOf = (chunks: string[]) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } },
  );

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("fetch http client", () => {
  it("composes baseUrl, path and query params on GET and parses JSON", async () => {
    const calls = stubFetch(() => json({ value: 42 }));
    const client = new FetchHttpClient({ baseUrl: "https://api.test" });

    const result = await client.get<{ value: number }>("/things", {
      params: { page: 2, active: true, skip: undefined },
    });

    expect(result).toEqual({ value: 42 });
    expect(calls[0].url).toBe("https://api.test/things?page=2&active=true");
    expect(calls[0].init.method).toBe("GET");
  });

  it("serializes a JSON body and sets content-type on POST", async () => {
    const calls = stubFetch(() => json({ id: "c1" }, 201));
    const client = new FetchHttpClient();

    const result = await client.post<{ id: string }, { content: string }>(
      "/api/conversations/c1/messages",
      { content: "oi" },
    );

    expect(result).toEqual({ id: "c1" });
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.body).toBe(JSON.stringify({ content: "oi" }));
    expect((calls[0].init.headers as Record<string, string>)["content-type"]).toContain(
      "application/json",
    );
  });

  it("throws HttpError carrying status and the contract error message", async () => {
    stubFetch(() => json({ error: { message: "conversation not found" } }, 404));
    const client = new FetchHttpClient();

    const failure = client.get("/api/conversations/missing");

    await expect(failure).rejects.toBeInstanceOf(HttpError);
    await expect(failure).rejects.toMatchObject({
      status: 404,
      message: "conversation not found",
    });
  });

  it("pushes decoded text chunks from a streamed body to the callback", async () => {
    stubFetch(() => streamOf(["Olá", " mun", "do"]));
    const client = new FetchHttpClient();

    const chunks: string[] = [];
    await client.stream(
      "/api/conversations/c1/messages",
      { method: "POST", body: { content: "oi", type: "text" } },
      (chunk) => chunks.push(chunk),
    );

    expect(chunks.join("")).toBe("Olá mundo");
  });

  it("returns no content for DELETE", async () => {
    const calls = stubFetch(() => new Response(null, { status: 204 }));
    const client = new FetchHttpClient();

    await client.delete<void>("/api/conversations/c1");

    expect(calls[0].init.method).toBe("DELETE");
  });
});
