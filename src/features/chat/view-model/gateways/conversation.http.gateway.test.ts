import { describe, expect, it } from "bun:test";

import type {
  HttpClient,
  HttpStreamConfig,
} from "@/features/shared/http/http-client";
import { HttpConversationGateway } from "./conversation.http.gateway";

type Recorder = {
  get: { url: string }[];
  post: { url: string; body: unknown }[];
  put: { url: string; body: unknown }[];
  stream: { url: string; config?: HttpStreamConfig }[];
};

const fakeHttpClient = (
  responses: Partial<{
    get: unknown;
    post: unknown;
    put: unknown;
    stream: string[];
    streamConversationId: string;
  }> = {},
): { client: HttpClient; calls: Recorder } => {
  const calls: Recorder = { get: [], post: [], put: [], stream: [] };
  const client = {
    get: async (url: string) => {
      calls.get.push({ url });
      return responses.get;
    },
    post: async (url: string, body?: unknown) => {
      calls.post.push({ url, body });
      return responses.post;
    },
    put: async (url: string, body?: unknown) => {
      calls.put.push({ url, body });
      return responses.put;
    },
    stream: async function* (url: string, config?: HttpStreamConfig) {
      calls.stream.push({ url, config });
      if (responses.streamConversationId) {
        config?.onResponse?.(
          new Response(null, { headers: { "x-conversation-id": responses.streamConversationId } }),
        );
      }
      for (const chunk of responses.stream ?? []) yield chunk;
    },
  } as unknown as HttpClient;
  return { client, calls };
};

describe("http conversation gateway", () => {
  it("lists conversations newest-first as summaries", async () => {
    const { client, calls } = fakeHttpClient({
      get: {
        conversations: [
          { id: "b", title: "Sobre TDD", createdAt: "2026-05-25T10:00:00.000Z" },
          { id: "a", title: "Nova conversa", createdAt: "2026-05-25T09:00:00.000Z" },
        ],
      },
    });

    const summaries = await new HttpConversationGateway(client).listConversations();

    expect(calls.get[0].url).toBe("/api/conversations");
    expect(summaries).toEqual([
      { id: "b", title: "Sobre TDD", createdAt: "2026-05-25T10:00:00.000Z" },
      { id: "a", title: "Nova conversa", createdAt: "2026-05-25T09:00:00.000Z" },
    ]);
  });

  it("begins a conversation: streams the reply and announces the new id from the header", async () => {
    const { client, calls } = fakeHttpClient({
      stream: ["Olá", " mundo"],
      streamConversationId: "c1",
    });
    const announced: string[] = [];
    const chunks: string[] = [];

    for await (const chunk of new HttpConversationGateway(client).beginConversation(
      "Oi",
      (id) => announced.push(id),
    )) {
      chunks.push(chunk);
    }

    expect(calls.stream[0].url).toBe("/api/conversations");
    expect(calls.stream[0].config?.method).toBe("POST");
    expect(announced).toEqual(["c1"]);
    expect(chunks).toEqual(["Olá", " mundo"]);
  });

  it("begins a conversation with voice turns mapped into a read model", async () => {
    const { client, calls } = fakeHttpClient({
      post: {
        id: "c1",
        title: "Olá",
        createdAt: "2026-05-25T10:00:00.000Z",
        instruction: null,
        messages: [],
      },
    });

    const conversation = await new HttpConversationGateway(client).beginConversationWithTurns([
      { role: "user", type: "voice", content: "Olá" },
    ]);

    expect(calls.post[0].url).toBe("/api/conversations/turns");
    expect(conversation.id).toBe("c1");
  });

  it("gets a conversation with its messages mapped", async () => {
    const { client, calls } = fakeHttpClient({
      get: {
        id: "c1",
        title: "Sobre TDD",
        createdAt: "2026-05-25T10:00:00.000Z",
        messages: [
          {
            id: "m1",
            role: "user",
            type: "text",
            content: "oi",
            createdAt: "2026-05-25T10:00:01.000Z",
          },
        ],
      },
    });

    const conversation = await new HttpConversationGateway(client).getConversation("c1");

    expect(calls.get[0].url).toBe("/api/conversations/c1");
    expect(conversation.messages[0]).toEqual({
      id: "m1",
      role: "user",
      type: "text",
      content: "oi",
      contents: [],
      createdAt: "2026-05-25T10:00:01.000Z",
    });
  });

  it("generates an image via POST and maps the image content", async () => {
    const { client, calls } = fakeHttpClient({
      post: {
        id: "c1",
        title: "Desenhe um gato",
        createdAt: "2026-05-25T10:00:00.000Z",
        instruction: null,
        messages: [
          {
            id: "u1",
            role: "user",
            type: "text",
            content: "Desenhe um gato",
            contents: [{ kind: "text", text: "Desenhe um gato" }],
            createdAt: "2026-05-25T10:00:01.000Z",
          },
          {
            id: "a1",
            role: "assistant",
            type: "text",
            content: "",
            contents: [{ kind: "image", uri: "data:image/png;base64,AAAA", mimeType: "image/png" }],
            createdAt: "2026-05-25T10:00:02.000Z",
          },
        ],
      },
    });

    const conversation = await new HttpConversationGateway(client).generateImage("c1", "Desenhe um gato");

    expect(calls.post[0].url).toBe("/api/conversations/c1/images");
    expect(calls.post[0].body).toEqual({ prompt: "Desenhe um gato", type: "text" });
    expect(conversation.messages[1]?.contents?.[0]).toEqual({
      kind: "image",
      uri: "data:image/png;base64,AAAA",
      mimeType: "image/png",
    });
  });

  it("streams the assistant reply via POST with the text message body", async () => {
    const { client, calls } = fakeHttpClient({ stream: ["Olá", " mundo"] });

    const chunks: string[] = [];
    for await (const chunk of new HttpConversationGateway(client).streamAssistantReply(
      "c1",
      "oi",
    )) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Olá", " mundo"]);
    expect(calls.stream[0].url).toBe("/api/conversations/c1/messages");
    expect(calls.stream[0].config).toMatchObject({
      method: "POST",
      body: { content: "oi", type: "text" },
    });
  });

  it("issues a live token via POST and maps the DTO", async () => {
    const { client, calls } = fakeHttpClient({
      post: {
        token: "ephemeral-123",
        expiresAt: "2026-05-25T10:30:00.000Z",
        model: "gemini-live-native-audio",
      },
    });

    const token = await new HttpConversationGateway(client).issueLiveToken();

    expect(calls.post[0].url).toBe("/api/live/token");
    expect(token).toEqual({
      token: "ephemeral-123",
      expiresAt: "2026-05-25T10:30:00.000Z",
      model: "gemini-live-native-audio",
    });
  });

  it("records turns via POST and returns the updated conversation", async () => {
    const { client, calls } = fakeHttpClient({
      post: {
        id: "c1",
        title: "Sobre voz",
        createdAt: "2026-05-25T10:00:00.000Z",
        messages: [
          {
            id: "u1",
            role: "user",
            type: "voice",
            content: "olá",
            createdAt: "2026-05-25T10:00:01.000Z",
          },
          {
            id: "a1",
            role: "assistant",
            type: "voice",
            content: "oi!",
            createdAt: "2026-05-25T10:00:02.000Z",
          },
        ],
      },
    });

    const turns = [
      { role: "user", type: "voice", content: "olá" },
      { role: "assistant", type: "voice", content: "oi!" },
    ] as const;

    const conversation = await new HttpConversationGateway(client).recordTurns("c1", [
      ...turns,
    ]);

    expect(calls.post[0].url).toBe("/api/conversations/c1/turns");
    expect(calls.post[0].body).toEqual({ turns: [...turns] });
    expect(conversation.title).toBe("Sobre voz");
    expect(conversation.messages).toHaveLength(2);
  });

  it("instructs the agent via PUT and maps the returned instruction", async () => {
    const { client, calls } = fakeHttpClient({
      put: {
        id: "c1",
        title: "Sobre TDD",
        createdAt: "2026-05-25T10:00:00.000Z",
        instruction: "Fale como um pirata",
        messages: [],
      },
    });

    const conversation = await new HttpConversationGateway(client).instructAgent(
      "c1",
      "Fale como um pirata",
    );

    expect(calls.put[0].url).toBe("/api/conversations/c1/agent");
    expect(calls.put[0].body).toEqual({ instruction: "Fale como um pirata" });
    expect(conversation.instruction).toBe("Fale como um pirata");
  });
});
