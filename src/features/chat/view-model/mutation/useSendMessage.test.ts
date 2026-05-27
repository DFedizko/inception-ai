import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import { useChatStore } from "../stores/chat.store";
import { useSendMessage } from "./useSendMessage";

const gateway = () => new HttpConversationGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

const streamOf = (texts: string[], headers?: Record<string, string>) =>
  new HttpResponse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const text of texts) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ kind: "answer", text })}\n`));
        }
        controller.close();
      },
    }),
    { headers: { "content-type": "application/x-ndjson; charset=utf-8", ...headers } },
  );

describe("useSendMessage", () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], activeConversationId: null });
  });

  it("begins a conversation, streams chunks into messages and settles the id", async () => {
    server.use(
      http.post("http://localhost/api/conversations", () =>
        streamOf(["Olá", " mundo"], { "x-conversation-id": "c1" }),
      ),
    );

    const { result } = renderHook(() => useSendMessage(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await result.current.mutateAsync("Oi");

    const messages = useChatStore.getState().messages;
    expect(messages[0].content).toBe("Oi");
    expect(messages[1].content).toBe("Olá mundo");
    expect(useChatStore.getState().activeConversationId).toBe("c1");
  });

  it("streams a reply into an already active conversation", async () => {
    useChatStore.setState({ activeConversationId: "c1", messages: [] });
    server.use(
      http.post("http://localhost/api/conversations/c1/messages", () => streamOf(["resposta"])),
    );

    const { result } = renderHook(() => useSendMessage(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await result.current.mutateAsync("Oi");

    expect(useChatStore.getState().messages[1].content).toBe("resposta");
  });

  it("keeps the conversation a draft when no id is returned", async () => {
    server.use(http.post("http://localhost/api/conversations", () => streamOf(["x"])));

    const { result } = renderHook(() => useSendMessage(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await result.current.mutateAsync("Oi");

    expect(useChatStore.getState().activeConversationId).toBeNull();
  });
});
