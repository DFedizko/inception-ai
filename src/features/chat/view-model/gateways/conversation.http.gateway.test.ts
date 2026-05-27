import { describe, expect, it } from "bun:test";

import type {
  HttpClient,
  HttpStreamConfig,
} from "@/features/shared/http/http-client";
import { UUID } from "@/features/shared/value-objects/uuid";
import { Message } from "../../model/message.model";
import type { AssistantReplyChunk } from "./conversation.gateway";
import { HttpConversationGateway } from "./conversation.http.gateway";

const uuid = {
  a: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  c1: "c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1",
  m1: "11111111-1111-4111-8111-111111111111",
  u1: "22222222-2222-4222-8222-222222222222",
  a1: "33333333-3333-4333-8333-333333333333",
};

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
    stream: async (
      url: string,
      config: HttpStreamConfig | undefined,
      onChunk: (chunk: string) => void,
    ) => {
      calls.stream.push({ url, config });
      if (responses.streamConversationId) {
        config?.onResponse?.(
          new Response(null, { headers: { "x-conversation-id": responses.streamConversationId } }),
        );
      }
      (responses.stream ?? []).forEach((fragment) => onChunk(fragment));
    },
  } as unknown as HttpClient;
  return { client, calls };
};

describe("http conversation gateway", () => {
  it("lists conversations newest-first as summaries", async () => {
    const { client, calls } = fakeHttpClient({
      get: {
        conversations: [
          { id: uuid.b, title: "Sobre TDD", createdAt: "2026-05-25T10:00:00.000Z" },
          { id: uuid.a, title: "Nova conversa", createdAt: "2026-05-25T09:00:00.000Z" },
        ],
      },
    });

    const summaries = await new HttpConversationGateway(client).listConversations();

    expect(calls.get[0].url).toBe("/api/conversations");
    expect(summaries).toEqual([
      { id: UUID.create(uuid.b), title: "Sobre TDD", createdAt: "2026-05-25T10:00:00.000Z" },
      { id: UUID.create(uuid.a), title: "Nova conversa", createdAt: "2026-05-25T09:00:00.000Z" },
    ]);
  });

  it("begins a conversation: streams the reply and announces the new id from the header", async () => {
    const { client, calls } = fakeHttpClient({
      stream: ['{"kind":"answer","text":"Olá"}\n', '{"kind":"answer","text":" mundo"}\n'],
      streamConversationId: "c1",
    });
    const announced: string[] = [];
    const chunks: AssistantReplyChunk[] = [];

    await new HttpConversationGateway(client).beginConversation(
      "Oi",
      (id) => announced.push(id),
      (chunk) => chunks.push(chunk),
    );

    expect(calls.stream[0].url).toBe("/api/conversations");
    expect(calls.stream[0].config?.method).toBe("POST");
    expect(announced).toEqual(["c1"]);
    expect(chunks).toEqual([
      { kind: "answer", text: "Olá" },
      { kind: "answer", text: " mundo" },
    ]);
  });

  it("begins a conversation with voice turns mapped into a read model", async () => {
    const { client, calls } = fakeHttpClient({
      post: {
        id: uuid.c1,
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
    expect(conversation.id.value).toBe(uuid.c1);
  });

  it("gets a conversation with its messages mapped", async () => {
    const { client, calls } = fakeHttpClient({
      get: {
        id: uuid.c1,
        title: "Sobre TDD",
        createdAt: "2026-05-25T10:00:00.000Z",
        messages: [
          {
            id: uuid.m1,
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
    expect(conversation.messages[0]).toEqual(
      new Message(UUID.create(uuid.m1), "user", "text", "oi", "2026-05-25T10:00:01.000Z", []),
    );
  });

  it("generates an image via POST and maps the image content", async () => {
    const { client, calls } = fakeHttpClient({
      post: {
        id: uuid.c1,
        title: "Desenhe um gato",
        createdAt: "2026-05-25T10:00:00.000Z",
        instruction: null,
        messages: [
          {
            id: uuid.u1,
            role: "user",
            type: "text",
            content: "Desenhe um gato",
            contents: [{ kind: "text", text: "Desenhe um gato" }],
            createdAt: "2026-05-25T10:00:01.000Z",
          },
          {
            id: uuid.a1,
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
    const { client, calls } = fakeHttpClient({
      stream: ['{"kind":"answer","text":"Olá"}\n', '{"kind":"answer","text":" mundo"}\n'],
    });

    const chunks: AssistantReplyChunk[] = [];
    await new HttpConversationGateway(client).streamAssistantReply("c1", "oi", (chunk) =>
      chunks.push(chunk),
    );

    expect(chunks).toEqual([
      { kind: "answer", text: "Olá" },
      { kind: "answer", text: " mundo" },
    ]);
    expect(calls.stream[0].url).toBe("/api/conversations/c1/messages");
    expect(calls.stream[0].config).toMatchObject({
      method: "POST",
      body: { content: "oi", type: "text" },
    });
  });

  it("reassembles ndjson chunks split across stream fragments and flushes the tail", async () => {
    const { client } = fakeHttpClient({
      stream: ['{"kind":"thou', 'ght","text":"hmm"}\n{"kind":"answer","text":"oi"}'],
    });

    const chunks: AssistantReplyChunk[] = [];
    await new HttpConversationGateway(client).streamAssistantReply("c1", "oi", (chunk) =>
      chunks.push(chunk),
    );

    expect(chunks).toEqual([
      { kind: "thought", text: "hmm" },
      { kind: "answer", text: "oi" },
    ]);
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
        id: uuid.c1,
        title: "Sobre voz",
        createdAt: "2026-05-25T10:00:00.000Z",
        messages: [
          {
            id: uuid.u1,
            role: "user",
            type: "voice",
            content: "olá",
            createdAt: "2026-05-25T10:00:01.000Z",
          },
          {
            id: uuid.a1,
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
        id: uuid.c1,
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
