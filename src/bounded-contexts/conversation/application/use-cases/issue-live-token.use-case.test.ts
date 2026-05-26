import { describe, expect, it } from "bun:test";
import { FakeLiveTokenProvider } from "../../infrastructure/ai/live-token-provider.fake";
import { IssueLiveToken } from "./issue-live-token.use-case";

describe("IssueLiveToken", () => {
  it("mints a token scoped to the live model", async () => {
    const provider = new FakeLiveTokenProvider({
      token: {
        token: "auth_tokens/abc",
        expiresAt: "2026-05-25T00:30:00.000Z",
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
      },
    });

    const token = await new IssueLiveToken(provider).execute();

    expect(token.token).toBe("auth_tokens/abc");
    expect(token.model).toBe("gemini-2.5-flash-native-audio-preview-12-2025");
    expect(new Date(token.expiresAt).toISOString()).toBe(token.expiresAt);
  });

  it("propagates a provider failure", async () => {
    const provider = new FakeLiveTokenProvider({ failure: new Error("mint failed") });

    await expect(new IssueLiveToken(provider).execute()).rejects.toThrow("mint failed");
  });
});
