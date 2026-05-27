import { describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import { conversationId, conversationResponse } from "../mocks/conversation/conversation";
import { useGetConversation } from "./useGetConversation";

const gateway = () => new HttpConversationGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

describe("useGetConversation", () => {
  it("fetches a conversation by id", async () => {
    server.use(
      http.get("http://localhost/api/conversations/c1", () =>
        HttpResponse.json(conversationResponse),
      ),
    );

    const { result } = renderHook(() => useGetConversation(gateway(), "c1"), {
      wrapper: buildQueryWrapper(),
    });

    await waitFor(() => expect(result.current.conversation?.id.value).toBe(conversationId));
    expect(result.current.conversation?.messages).toHaveLength(2);
  });

  it("stays idle and returns null when no id is given", () => {
    const { result } = renderHook(() => useGetConversation(gateway(), null), {
      wrapper: buildQueryWrapper(),
    });

    expect(result.current.conversation).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it("exposes the error when the request fails", async () => {
    server.use(
      http.get("http://localhost/api/conversations/c1", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useGetConversation(gateway(), "c1"), {
      wrapper: buildQueryWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
