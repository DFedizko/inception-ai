import { describe, expect, it } from "bun:test";
import { FetchHttpClient } from "./http-client.fetch";
import { HttpError } from "./http-client";

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("FetchHttpClient", () => {
  it("performs a typed GET and parses the JSON response", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchFn = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return jsonResponse({ id: "42" });
    }) as unknown as typeof fetch;

    const client = new FetchHttpClient(fetchFn);
    const result = await client.get<{ id: string }>("https://api.test/items/42");

    expect(result).toEqual({ id: "42" });
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("serializes the body and sets JSON content-type on POST", async () => {
    let captured: RequestInit | undefined;
    const fetchFn = (async (_url: string | URL, init?: RequestInit) => {
      captured = init;
      return jsonResponse({ ok: true }, 201);
    }) as unknown as typeof fetch;

    const client = new FetchHttpClient(fetchFn);
    await client.post<{ ok: boolean }, { name: string }>("https://api.test/items", {
      name: "rice",
    });

    expect(captured?.method).toBe("POST");
    expect(captured?.body).toBe(JSON.stringify({ name: "rice" }));
    expect((captured?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("appends query params and respects baseUrl", async () => {
    let calledUrl = "";
    const fetchFn = (async (url: string | URL) => {
      calledUrl = String(url);
      return jsonResponse([]);
    }) as unknown as typeof fetch;

    const client = new FetchHttpClient(fetchFn);
    await client.get("/items", { baseUrl: "https://api.test", query: { page: 2, q: "rice" } });

    expect(calledUrl).toBe("https://api.test/items?page=2&q=rice");
  });

  it("throws an HttpError carrying status and body on a non-2xx response", async () => {
    const fetchFn = (async () =>
      new Response("nope", { status: 404 })) as unknown as typeof fetch;

    const client = new FetchHttpClient(fetchFn);

    await expect(client.get("https://api.test/missing")).rejects.toBeInstanceOf(HttpError);
  });

  it("streams the response body chunk by chunk", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("Hel"));
        controller.enqueue(encoder.encode("lo"));
        controller.close();
      },
    });
    const fetchFn = (async () =>
      new Response(body, { status: 200 })) as unknown as typeof fetch;

    const client = new FetchHttpClient(fetchFn);
    const decoder = new TextDecoder();
    let assembled = "";
    await client.stream("https://api.test/stream", { method: "POST" }, (chunk) => {
      assembled += decoder.decode(chunk);
    });

    expect(assembled).toBe("Hello");
  });
});
