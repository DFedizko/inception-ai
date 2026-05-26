import { describe, expect, it } from "bun:test";
import {
  GeminiLiveTokenProvider,
  type GeminiAuthTokenClient,
} from "./live-token-provider.gemini";

describe("GeminiLiveTokenProvider", () => {
  it("mints a token scoped to the live model and v1alpha, returning token.name", async () => {
    let capturedConfig: unknown;
    const client: GeminiAuthTokenClient = {
      authTokens: {
        create: async (args) => {
          capturedConfig = args.config;
          return { name: "auth_tokens/xyz" };
        },
      },
    };

    const token = await new GeminiLiveTokenProvider(client, "live-model-1").mint();

    expect(token.token).toBe("auth_tokens/xyz");
    expect(token.model).toBe("live-model-1");
    expect(new Date(token.expiresAt).toISOString()).toBe(token.expiresAt);
    expect(capturedConfig).toMatchObject({
      uses: 1,
      liveConnectConstraints: { model: "live-model-1" },
      httpOptions: { apiVersion: "v1alpha" },
    });
  });

  it("fails when the SDK returns no token name", async () => {
    const client: GeminiAuthTokenClient = {
      authTokens: { create: async () => ({}) },
    };

    await expect(new GeminiLiveTokenProvider(client, "live-model-1").mint()).rejects.toThrow(
      "ephemeral token name",
    );
  });
});
