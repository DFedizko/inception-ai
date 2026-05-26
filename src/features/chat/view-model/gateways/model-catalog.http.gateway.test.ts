import { describe, expect, it } from "bun:test";

import type {
  HttpClient,
  HttpRequestConfig,
} from "@/features/shared/http/http-client";
import { HttpModelCatalogGateway } from "./model-catalog.http.gateway";

const fakeHttpClient = (response: unknown): { client: HttpClient; urls: string[] } => {
  const urls: string[] = [];
  const client = {
    get: async (url: string, _config?: HttpRequestConfig) => {
      urls.push(url);
      return response;
    },
  } as unknown as HttpClient;
  return { client, urls };
};

describe("http model catalog gateway", () => {
  it("lists models mapped from the catalog DTO", async () => {
    const { client, urls } = fakeHttpClient({
      models: [
        { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", capabilities: ["text"], tier: "free" },
        {
          id: "gemini-2.5-flash-preview-tts",
          label: "Gemini 2.5 Flash TTS",
          capabilities: ["text", "speech"],
          tier: "paid",
        },
      ],
    });

    const models = await new HttpModelCatalogGateway(client).listModels();

    expect(urls[0]).toBe("/api/models");
    expect(models).toEqual([
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", capabilities: ["text"], tier: "free" },
      {
        id: "gemini-2.5-flash-preview-tts",
        label: "Gemini 2.5 Flash TTS",
        capabilities: ["text", "speech"],
        tier: "paid",
      },
    ]);
  });

  it("returns an empty list when the catalog is empty", async () => {
    const { client } = fakeHttpClient({ models: [] });

    expect(await new HttpModelCatalogGateway(client).listModels()).toEqual([]);
  });
});
