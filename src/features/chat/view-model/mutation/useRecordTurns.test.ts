import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import {
  conversationId,
  conversationResponse,
} from "../mocks/conversation/conversation";
import { useChatStore } from "../stores/chat.store";
import { useRecordTurns } from "./useRecordTurns";

const gateway = () =>
  new HttpConversationGateway(
    new FetchHttpClient({ baseUrl: "http://localhost" }),
  );

describe("useRecordTurns", () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], activeConversationId: null });
  });

  it("records voice turns and adopts the returned conversation", async () => {
    server.use(
      http.post("http://localhost/api/conversations/c1/turns", () =>
        HttpResponse.json(conversationResponse),
      ),
    );

    const { result } = renderHook(() => useRecordTurns(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await result.current.mutateAsync({
      conversationId: "c1",
      turns: [{ role: "user", type: "voice", content: "olá" }],
    });

    await waitFor(() =>
      expect(useChatStore.getState().activeConversationId).toBe(conversationId),
    );
    expect(useChatStore.getState().messages).toHaveLength(2);
  });
});
