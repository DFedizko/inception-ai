import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import { instructedConversationResponse } from "../mocks/conversation/conversation";
import { useChatStore } from "../stores/chat.store";
import { useInstructAgent } from "./useInstructAgent";

const gateway = () => new HttpConversationGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

describe("useInstructAgent", () => {
  beforeEach(() => {
    useChatStore.setState({ activeInstruction: null });
  });

  it("instructs the agent and hydrates the active instruction", async () => {
    server.use(
      http.put("http://localhost/api/conversations/c1/agent", () =>
        HttpResponse.json(instructedConversationResponse),
      ),
    );

    const { result } = renderHook(() => useInstructAgent(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await result.current.mutateAsync({ conversationId: "c1", instruction: "Seja o Toby" });

    await waitFor(() =>
      expect(useChatStore.getState().activeInstruction).toBe("Você é o Toby, um médico"),
    );
  });
});
