import type { LiveToken, LiveTokenProvider } from "../../application/ports/live-token-provider";

type FakeLiveTokenProviderOptions = {
  token?: LiveToken;
  failure?: Error;
};

export class FakeLiveTokenProvider implements LiveTokenProvider {
  private readonly token: LiveToken;
  private readonly failure?: Error;

  constructor(options: FakeLiveTokenProviderOptions = {}) {
    this.token = options.token ?? {
      token: "auth_tokens/fake",
      expiresAt: "2026-05-25T00:30:00.000Z",
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
    };
    this.failure = options.failure;
  }

  async mint(): Promise<LiveToken> {
    if (this.failure) {
      throw this.failure;
    }
    return this.token;
  }
}
