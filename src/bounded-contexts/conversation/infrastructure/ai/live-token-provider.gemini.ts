import { GoogleGenAI } from "@google/genai";
import type { LiveToken, LiveTokenProvider } from "../../application/ports/live-token-provider";

type CreatedAuthToken = { name?: string };

type AuthTokenCreateConfig = {
  uses: number;
  expireTime: string;
  newSessionExpireTime: string;
  liveConnectConstraints: { model: string };
  httpOptions: { apiVersion: string };
};

export interface GeminiAuthTokenClient {
  authTokens: {
    create(args: { config: AuthTokenCreateConfig }): Promise<CreatedAuthToken>;
  };
}

const defaultLiveModel = "gemini-3.1-flash-live-preview";
const sessionWindowMs = 30 * 60 * 1000;
const newSessionWindowMs = 60 * 1000;

export class GeminiLiveTokenProvider implements LiveTokenProvider {
  constructor(
    private readonly client: GeminiAuthTokenClient,
    private readonly model: string = process.env.GEMINI_LIVE_MODEL ?? defaultLiveModel,
  ) {}

  async mint(): Promise<LiveToken> {
    const expireTime = new Date(Date.now() + sessionWindowMs).toISOString();
    const created = await this.client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime: new Date(Date.now() + newSessionWindowMs).toISOString(),
        liveConnectConstraints: { model: this.model },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    if (!created.name) {
      throw new Error("Gemini did not return an ephemeral token name.");
    }

    return { token: created.name, expiresAt: expireTime, model: this.model };
  }
}

export const createGeminiLiveTokenProvider = (): GeminiLiveTokenProvider => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GeminiLiveTokenProvider(
    new GoogleGenAI({ apiKey }) as unknown as GeminiAuthTokenClient,
  );
};
