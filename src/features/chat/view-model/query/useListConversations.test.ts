import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import { conversationsResponse } from "../mocks/conversation/conversations";
import { useChatStore } from "../stores/chat.store";
import { useListConversations } from "./useListConversations";

const gateway = () => new HttpConversationGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

describe("useListConversations", () => {
  beforeEach(() => {
    useChatStore.setState({ conversations: [], isLoadingConversations: false });
  });

  it("fetches the conversations and hydrates the store", async () => {
    server.use(
      http.get("http://localhost/api/conversations", () =>
        HttpResponse.json(conversationsResponse),
      ),
    );

    const { result } = renderHook(() => useListConversations(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await waitFor(() => expect(useChatStore.getState().conversations).toHaveLength(2));
    expect(result.current.conversations[0].title).toBe("Sobre TDD");
    expect(useChatStore.getState().isLoadingConversations).toBe(false);
  });

  it("exposes the error when the request fails", async () => {
    server.use(
      http.get("http://localhost/api/conversations", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useListConversations(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(useChatStore.getState().conversations).toHaveLength(0);
  });
});
