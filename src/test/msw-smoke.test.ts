import { describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";

import { server } from "./server";

describe("msw interception", () => {
  it("intercepts a fetch under bun test", async () => {
    server.use(
      http.get("http://localhost/ping", () => HttpResponse.json({ ok: true })),
    );
    const response = await fetch("http://localhost/ping");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("intercepts a streamed response body", async () => {
    server.use(
      http.post("http://localhost/stream", () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("Olá"));
            controller.enqueue(new TextEncoder().encode(" mundo"));
            controller.close();
          },
        });
        return new HttpResponse(stream, { headers: { "x-conversation-id": "c1" } });
      }),
    );
    const response = await fetch("http://localhost/stream", { method: "POST" });
    expect(response.headers.get("x-conversation-id")).toBe("c1");
    expect(await response.text()).toBe("Olá mundo");
  });
});
