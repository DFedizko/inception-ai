import { describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpConversationGateway } from "../gateways/conversation.http.gateway";
import { liveTokenResponse } from "../mocks/conversation/live-token";
import { useIssueLiveToken } from "./useIssueLiveToken";

const gateway = () => new HttpConversationGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

describe("useIssueLiveToken", () => {
  it("issues an ephemeral live token", async () => {
    server.use(
      http.post("http://localhost/api/live/token", () => HttpResponse.json(liveTokenResponse)),
    );

    const { result } = renderHook(() => useIssueLiveToken(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    const token = await result.current.mutateAsync();

    expect(token.token).toBe("ephemeral-token-abc");
    expect(token.model).toBe("live-1");
  });
});
