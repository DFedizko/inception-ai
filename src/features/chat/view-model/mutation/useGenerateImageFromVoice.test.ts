import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import { conversationId, conversationResponse } from "../mocks/conversation/conversation";
import { useChatStore } from "../stores/chat.store";
import { useGenerateImageFromVoice } from "./useGenerateImageFromVoice";

const gateway = () => new HttpConversationGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

describe("useGenerateImageFromVoice", () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], activeConversationId: null });
  });

  it("generates an image from recorded audio and adopts the conversation", async () => {
    server.use(
      http.post("http://localhost/api/conversations/c1/images/voice", () =>
        HttpResponse.json(conversationResponse),
      ),
    );

    const { result } = renderHook(() => useGenerateImageFromVoice(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await result.current.mutateAsync({
      conversationId: "c1",
      audio: { data: "ZGF0YQ==", mimeType: "audio/webm" },
    });

    await waitFor(() => expect(useChatStore.getState().messages).toHaveLength(2));
    expect(useChatStore.getState().activeConversationId).toBe(conversationId);
  });
});
