import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { HttpModelCatalogGateway } from "../gateways/model-catalog.http.gateway";
import { modelsResponse } from "../mocks/model-catalog/models";
import { useChatStore } from "../stores/chat.store";
import { useListModels } from "./useListModels";

const gateway = () => new HttpModelCatalogGateway(new FetchHttpClient({ baseUrl: "http://localhost" }));

describe("useListModels", () => {
  beforeEach(() => {
    useChatStore.setState({ models: [], isLoadingModels: false });
  });

  it("fetches the model catalog and hydrates the store", async () => {
    server.use(
      http.get("http://localhost/api/models", () => HttpResponse.json(modelsResponse)),
    );

    const { result } = renderHook(() => useListModels(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await waitFor(() => expect(useChatStore.getState().models).toHaveLength(3));
    expect(result.current.models[0].id).toBe("text-1");
  });

  it("exposes the error when the request fails", async () => {
    server.use(
      http.get("http://localhost/api/models", () => HttpResponse.json({}, { status: 500 })),
    );

    const { result } = renderHook(() => useListModels(gateway()), {
      wrapper: buildQueryWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
