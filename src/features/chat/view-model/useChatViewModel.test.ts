import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "bun:test";
import { http, HttpResponse } from "msw";

import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";
import { useNotificationStore } from "@/features/shared/ui/notification";
import { buildQueryWrapper } from "@/test/renderWithProviders";
import { server } from "@/test/server";
import { setAudioHooks } from "./audio/audio.provider";
import type { RecordedAudio, VoiceRecorder } from "./audio/voice-recorder.ports";
import { setVoiceRecorder } from "./audio/voice-recorder.provider";
import { HttpConversationGateway } from "./gateways/conversation.http.gateway";
import { setConversationGateway } from "./gateways/conversation.gateway.provider";
import { HttpModelCatalogGateway } from "./gateways/model-catalog.http.gateway";
import { setModelCatalogGateway } from "./gateways/model-catalog.gateway.provider";
import { setLiveSessionConnector } from "./live/live-session.provider";
import type { LiveSessionCallbacks } from "./live/live-session.port";
import { conversationId, conversationResponse } from "./mocks/conversation/conversation";
import { modelsResponse } from "./mocks/model-catalog/models";
import { useChatStore } from "./stores/chat.store";
import { useChatViewModel } from "./useChatViewModel";

const base = "http://localhost";

const installGateways = () => {
  setConversationGateway(new HttpConversationGateway(new FetchHttpClient({ baseUrl: base })));
  setModelCatalogGateway(new HttpModelCatalogGateway(new FetchHttpClient({ baseUrl: base })));
};

let micOnFrame: ((frame: Int16Array) => void) | null = null;
const noopAudio = () =>
  setAudioHooks(
    () => ({ isCapturing: false, error: null, start: async (onFrame) => { micOnFrame = onFrame; }, stop: async () => {}, getLevel: () => 0 }),
    () => ({ isPlaying: false, error: null, start: () => {}, stop: () => {}, enqueue: () => {}, getLevel: () => 0 }),
  );

const installRecorder = (recorder: VoiceRecorder) => setVoiceRecorder(() => recorder);

const baseRecorder = (overrides: Partial<VoiceRecorder> = {}): VoiceRecorder => ({
  isRecording: false,
  start: async () => {},
  stop: async (): Promise<RecordedAudio> => ({ data: "ZA==", mimeType: "audio/webm" }),
  ...overrides,
});

const liveControl: { callbacks: LiveSessionCallbacks | null; throwOnFrame: boolean } = {
  callbacks: null,
  throwOnFrame: false,
};
const installLive = () =>
  setLiveSessionConnector({
    connect: async (_config, callbacks) => {
      liveControl.callbacks = callbacks;
      return {
        sendAudioFrame: () => {
          if (liveControl.throwOnFrame) throw new Error("frame failed");
        },
        sendText: () => {},
        close: async () => {},
      };
    },
  });

const streamOf = (texts: string[], headers?: Record<string, string>) =>
  new HttpResponse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const text of texts) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ kind: "answer", text })}\n`));
        }
        controller.close();
      },
    }),
    { headers: { "content-type": "application/x-ndjson; charset=utf-8", ...headers } },
  );

const liveTokenHandler = () =>
  http.post(`${base}/api/live/token`, () =>
    HttpResponse.json({ token: "t", expiresAt: "x", model: "live-1" }),
  );

const lastNotification = () => {
  const { notifications } = useNotificationStore.getState();
  return notifications[notifications.length - 1];
};

const render = () => renderHook(() => useChatViewModel(), { wrapper: buildQueryWrapper() });

describe("useChatViewModel", () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      activeConversationId: null,
      openingConversationId: null,
      messages: [],
      isReplying: false,
      mode: "text",
      models: [],
      selectedModelId: null,
      activeInstruction: null,
    });
    useNotificationStore.setState({ notifications: [] });
    installGateways();
    noopAudio();
    installRecorder(baseRecorder());
    liveControl.callbacks = null;
    liveControl.throwOnFrame = false;
    server.use(
      http.get(`${base}/api/conversations`, () => HttpResponse.json({ conversations: [] })),
      http.get(`${base}/api/conversations/:id`, () => HttpResponse.json(conversationResponse)),
      http.get(`${base}/api/models`, () => HttpResponse.json(modelsResponse)),
    );
  });

  it("generates an image from the active conversation", async () => {
    server.use(
      http.post(`${base}/api/conversations/images`, () => HttpResponse.json(conversationResponse)),
    );
    const { result } = render();

    await act(async () => {
      result.current.generateImage("um gato astronauta");
    });

    await waitFor(() => expect(useChatStore.getState().messages).toHaveLength(2));
    expect(useChatStore.getState().activeConversationId).toBe(conversationId);
  });

  it("ignores a blank image prompt", async () => {
    const { result } = render();
    await act(async () => {
      result.current.generateImage("   ");
    });
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it("notifies when the image generation fails", async () => {
    server.use(
      http.post(`${base}/api/conversations/images`, () => HttpResponse.json({}, { status: 500 })),
    );
    const { result } = render();

    await act(async () => {
      result.current.generateImage("falha");
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível gerar a imagem."),
    );
  });

  it("falls back to the first model when none is text-capable", async () => {
    useChatStore.setState({ mode: "text", selectedModelId: null });
    server.use(
      http.get(`${base}/api/models`, () =>
        HttpResponse.json({
          models: [{ id: "img-only", label: "Imagem", capabilities: ["image"], tier: "paid" }],
        }),
      ),
    );
    render();
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("img-only"));
  });

  it("generates a video and announces the wait", async () => {
    server.use(
      http.post(`${base}/api/conversations/videos`, () => HttpResponse.json(conversationResponse)),
    );
    const { result } = render();

    await act(async () => {
      result.current.generateVideo("um pôr do sol");
    });

    await waitFor(() => expect(useChatStore.getState().messages).toHaveLength(2));
    expect(useChatStore.getState().activeConversationId).toBe(conversationId);
  });

  it("notifies when the video generation fails", async () => {
    server.use(
      http.post(`${base}/api/conversations/videos`, () => HttpResponse.json({}, { status: 500 })),
    );
    const { result } = render();

    await act(async () => {
      result.current.generateVideo("falha");
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível gerar o vídeo."),
    );
  });

  it("notifies when the pending instruction cannot be applied to the new conversation", async () => {
    useChatStore.setState({ activeInstruction: "seja breve" });
    server.use(
      http.post(`${base}/api/conversations`, () => streamOf(["oi"], { "x-conversation-id": "conv-x" })),
      http.put(`${base}/api/conversations/conv-x/agent`, () => HttpResponse.json({}, { status: 500 })),
    );
    const { result } = render();

    await act(async () => {
      result.current.sendMessage("oi");
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível salvar a instrução do agente."),
    );
  });

  it("starts recording on the first record tap", async () => {
    let started = false;
    installRecorder(baseRecorder({ start: async () => { started = true; } }));
    const { result } = render();

    await act(async () => {
      result.current.recordImagePrompt();
    });

    expect(started).toBe(true);
  });

  it("notifies when the microphone is unavailable", async () => {
    installRecorder(baseRecorder({ start: async () => { throw new Error("no mic"); } }));
    const { result } = render();

    await act(async () => {
      result.current.recordImagePrompt();
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível acessar o microfone."),
    );
  });

  it("generates an image from the recorded voice prompt", async () => {
    installRecorder(baseRecorder({ isRecording: true }));
    server.use(
      http.post(`${base}/api/conversations/images/voice`, () =>
        HttpResponse.json(conversationResponse),
      ),
    );
    const { result } = render();

    await act(async () => {
      result.current.recordImagePrompt();
    });

    await waitFor(() => expect(useChatStore.getState().messages).toHaveLength(2));
  });

  it("notifies when generating the image from voice fails", async () => {
    installRecorder(baseRecorder({ isRecording: true }));
    server.use(
      http.post(`${base}/api/conversations/images/voice`, () => HttpResponse.json({}, { status: 500 })),
    );
    const { result } = render();

    await act(async () => {
      result.current.recordImagePrompt();
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível gerar a imagem por voz."),
    );
  });

  it("notifies when capturing the audio fails", async () => {
    installRecorder(
      baseRecorder({ isRecording: true, stop: async () => { throw new Error("broke"); } }),
    );
    const { result } = render();

    await act(async () => {
      result.current.recordImagePrompt();
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível capturar o áudio."),
    );
  });

  it("opens an existing conversation and adopts its messages", async () => {
    server.use(
      http.get(`${base}/api/conversations/${conversationId}`, () =>
        HttpResponse.json(conversationResponse),
      ),
    );
    const { result } = render();

    act(() => {
      result.current.openConversation(conversationId);
    });

    await waitFor(() => expect(useChatStore.getState().messages).toHaveLength(2));
    expect(useChatStore.getState().openingConversationId).toBeNull();
  });

  it("notifies when opening a conversation fails", async () => {
    server.use(
      http.get(`${base}/api/conversations/${conversationId}`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const { result } = render();

    act(() => {
      result.current.openConversation(conversationId);
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível abrir esta conversa."),
    );
    expect(useChatStore.getState().openingConversationId).toBeNull();
  });

  it("notifies when saving the agent instruction fails", async () => {
    useChatStore.setState({ activeConversationId: conversationId });
    server.use(
      http.get(`${base}/api/conversations/${conversationId}`, () =>
        HttpResponse.json(conversationResponse),
      ),
      http.put(`${base}/api/conversations/${conversationId}/agent`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const { result } = render();

    await act(async () => {
      result.current.instructAgent("seja o Toby");
    });

    await waitFor(() =>
      expect(lastNotification()?.message).toBe("Não foi possível salvar a instrução do agente."),
    );
  });

  it("selects a live model by default when entering in voice mode", async () => {
    useChatStore.setState({ mode: "voice", selectedModelId: null });
    render();
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("live-1"));
  });

  it("derives the capabilities of the selected model", async () => {
    useChatStore.setState({ selectedModelId: "media-1" });
    server.use(
      http.get(`${base}/api/models`, () =>
        HttpResponse.json({
          models: [
            { id: "media-1", label: "Mídia", capabilities: ["text", "image", "video", "live"], tier: "paid" },
          ],
        }),
      ),
    );
    const { result } = render();

    await waitFor(() => expect(result.current.canGenerateImage).toBe(true));
    expect(result.current.canGenerateVideo).toBe(true);
    expect(result.current.canUseVoice).toBe(true);
  });

  it("ignores empty text-to-voice input", async () => {
    const { result } = render();
    await act(async () => {
      await result.current.sendTextToVoice("   ");
    });
    expect(useChatStore.getState().liveStatus).toBe("idle");
    expect(typeof result.current.getAudioLevel()).toBe("number");
  });

  it("ends the live session when sending an audio frame throws", async () => {
    useChatStore.setState({ selectedModelId: "live-1" });
    installLive();
    liveControl.throwOnFrame = true;
    server.use(liveTokenHandler());
    const { result } = render();

    await waitFor(() => expect(useChatStore.getState().models.length).toBeGreaterThan(0));
    await act(async () => {
      await result.current.startVoice();
    });
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    await act(async () => {
      micOnFrame?.(Int16Array.from([1]));
    });

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("error"));
  });

  it("recovers when persisting a completed voice turn fails", async () => {
    useChatStore.setState({ selectedModelId: "live-1", activeConversationId: conversationId });
    installLive();
    server.use(
      liveTokenHandler(),
      http.get(`${base}/api/conversations/${conversationId}`, () =>
        HttpResponse.json(conversationResponse),
      ),
      http.post(`${base}/api/conversations/${conversationId}/turns`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const { result } = render();

    await waitFor(() => expect(useChatStore.getState().models.length).toBeGreaterThan(0));
    await act(async () => {
      await result.current.startVoice();
    });
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    await act(async () => {
      liveControl.callbacks?.onInputTranscript("olá");
      liveControl.callbacks?.onTurnComplete();
    });

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));
  });
});
