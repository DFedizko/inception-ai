import { beforeEach, describe, expect, it } from "bun:test";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { AiModel } from "../model/ai-model.model";
import type { Conversation } from "../model/conversation.model";
import type { ConversationSummary } from "../model/conversation-summary.model";
import type {
  ConversationGateway,
  TurnInput,
} from "../view-model/gateways/conversation.gateway";
import { setConversationGateway } from "../view-model/gateways/conversation.gateway.provider";
import type { ModelCatalogGateway } from "../view-model/gateways/model-catalog.gateway";
import { setModelCatalogGateway } from "../view-model/gateways/model-catalog.gateway.provider";
import { setAudioHooks } from "../view-model/audio/audio.provider";
import type { MicStream, AudioSink, OnMicFrame } from "../view-model/audio/audio.ports";
import { setLiveSessionConnector } from "../view-model/live/live-session.provider";
import type {
  LiveSession,
  LiveSessionCallbacks,
  LiveSessionConfig,
  LiveSessionConnector,
} from "../view-model/live/live-session.port";
import { useChatStore } from "../view-model/stores/chat.store";
import { useNotificationStore } from "@/features/shared/ui/notification";
import { ChatView } from "./ChatView";

const at = "2026-05-25T10:00:00.000Z";

const recordedTurns: TurnInput[][] = [];
const liveSpy: {
  connects: LiveSessionConfig[];
  callbacks: LiveSessionCallbacks | null;
  sentText: string[];
  framesSent: number;
  failConnect: boolean;
} = {
  connects: [],
  callbacks: null,
  sentText: [],
  framesSent: 0,
  failConnect: false,
};

const micSpy: { started: boolean; onFrame: OnMicFrame | null } = {
  started: false,
  onFrame: null,
};
const sinkSpy: { enqueued: number; started: boolean; stopped: number } = {
  enqueued: 0,
  started: false,
  stopped: 0,
};

type FakeOptions = { chunks: string[]; failAfterFirstChunk?: boolean };

const fakeGateway = (options: FakeOptions): ConversationGateway => {
  let conversations: ConversationSummary[] = [];
  const conversation: Conversation = {
    id: "c1",
    title: "Nova conversa",
    createdAt: at,
    instruction: null,
    messages: [],
  };

  const streamReply = async function* () {
    conversations = [{ id: "c1", title: "Sobre TDD", createdAt: at }];
    let yielded = 0;
    for (const chunk of options.chunks) {
      yield chunk;
      yielded += 1;
      if (options.failAfterFirstChunk && yielded === 1) {
        throw new Error("stream broke");
      }
    }
  };

  return {
    listConversations: async () => conversations,
    getConversation: async () => conversation,
    beginConversation: async function* (content: string, onConversationId: (id: string) => void) {
      conversation.messages = [
        { id: "u0", role: "user", type: "text", content, createdAt: at },
      ];
      onConversationId("c1");
      yield* streamReply();
    },
    beginConversationWithTurns: async (turns: TurnInput[]) => {
      recordedTurns.push(turns);
      conversation.messages = turns.map((turn, index) => ({
        id: `t${index}`,
        role: turn.role,
        type: turn.type,
        content: turn.content,
        createdAt: at,
      }));
      conversations = [{ id: "c1", title: "Sobre voz", createdAt: at }];
      return conversation;
    },
    streamAssistantReply: streamReply,
    issueLiveToken: async () => ({
      token: "ephemeral",
      expiresAt: at,
      model: "live-1",
    }),
    recordTurns: async (_id: string, turns: TurnInput[]) => {
      recordedTurns.push(turns);
      conversation.messages = [
        ...conversation.messages,
        ...turns.map((turn, index) => ({
          id: `t${conversation.messages.length + index}`,
          role: turn.role,
          type: turn.type,
          content: turn.content,
          createdAt: at,
        })),
      ];
      conversations = [{ id: "c1", title: "Sobre voz", createdAt: at }];
      return conversation;
    },
    instructAgent: async (_id: string, instruction: string) => {
      conversation.instruction = instruction.trim();
      return conversation;
    },
    generateImage: async () => conversation,
    generateImageFromVoice: async () => conversation,
    generateVideo: async () => conversation,
  };
};

const fakeCatalog = (models: AiModel[]): ModelCatalogGateway => ({
  listModels: async () => models,
});

const textOnly: AiModel = { id: "text-1", label: "Modelo Texto", capabilities: ["text"], tier: "free" };
const liveModel: AiModel = {
  id: "live-1",
  label: "Modelo Voz",
  capabilities: ["text", "live"],
  tier: "free",
};

const installFakeLive = () => {
  const connector: LiveSessionConnector = {
    connect: async (config: LiveSessionConfig, callbacks: LiveSessionCallbacks) => {
      if (liveSpy.failConnect) throw new Error("connect failed");
      liveSpy.connects.push(config);
      liveSpy.callbacks = callbacks;
      const session: LiveSession = {
        sendAudioFrame: () => {
          liveSpy.framesSent += 1;
        },
        sendText: (text) => liveSpy.sentText.push(text),
        close: async () => {},
      };
      return session;
    },
  };
  setLiveSessionConnector(connector);
};

const installAudioFakes = () => {
  setAudioHooks(
    (): MicStream => ({
      isCapturing: false,
      error: null,
      start: async (onFrame: OnMicFrame) => {
        micSpy.started = true;
        micSpy.onFrame = onFrame;
      },
      stop: async () => {
        micSpy.started = false;
      },
      getLevel: () => 0,
    }),
    (): AudioSink => ({
      isPlaying: false,
      error: null,
      start: () => {
        sinkSpy.started = true;
      },
      stop: () => {
        sinkSpy.stopped += 1;
      },
      enqueue: () => {
        sinkSpy.enqueued += 1;
      },
      getLevel: () => 0,
    }),
  );
};

const resetStore = () =>
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    messages: [],
    isReplying: false,
    mode: "text",
    models: [],
    selectedModelId: null,
    liveStatus: "idle",
    isListening: false,
    isSpeaking: false,
    userCaption: "",
    assistantCaption: "",
    activeInstruction: null,
  });

const startConversation = () =>
  fireEvent.click(screen.getByRole("button", { name: "Nova conversa" }));

const pickModel = (label: string) => {
  fireEvent.click(screen.getByRole("combobox", { name: "Modelo" }));
  fireEvent.click(screen.getByRole("option", { name: new RegExp(label) }));
};

const goVoice = () => {
  pickModel("Modelo Voz");
  fireEvent.click(screen.getByRole("button", { name: "Conversar por voz" }));
};

const typeAndSend = (text: string, placeholder: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
};

describe("chat feature", () => {
  beforeEach(() => {
    resetStore();
    useNotificationStore.setState({ notifications: [] });
    recordedTurns.length = 0;
    liveSpy.connects = [];
    liveSpy.callbacks = null;
    liveSpy.sentText = [];
    liveSpy.framesSent = 0;
    liveSpy.failConnect = false;
    micSpy.started = false;
    micSpy.onFrame = null;
    sinkSpy.enqueued = 0;
    sinkSpy.started = false;
    sinkSpy.stopped = 0;
    setModelCatalogGateway(fakeCatalog([textOnly, liveModel]));
    installAudioFakes();
    installFakeLive();
  });

  it("starts a conversation, streams the reply and refreshes the sidebar title", async () => {
    setConversationGateway(fakeGateway({ chunks: ["Olá", " mundo"] }));
    render(<ChatView />);

    startConversation();
    await screen.findByPlaceholderText("Escreva uma mensagem...");

    typeAndSend("Oi", "Escreva uma mensagem...");

    expect(await screen.findByText("Oi")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Olá mundo/)).toBeInTheDocument());
    expect((await screen.findAllByText("Sobre TDD")).length).toBeGreaterThan(0);
  });

  it("ignores a blank message", async () => {
    setConversationGateway(fakeGateway({ chunks: ["Olá"] }));
    render(<ChatView />);

    startConversation();
    await screen.findByPlaceholderText("Escreva uma mensagem...");

    typeAndSend("   ", "Escreva uma mensagem...");

    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it("keeps the partial reply when the stream fails mid-way", async () => {
    setConversationGateway(
      fakeGateway({ chunks: ["Parci", "al"], failAfterFirstChunk: true }),
    );
    render(<ChatView />);

    startConversation();
    await screen.findByPlaceholderText("Escreva uma mensagem...");

    typeAndSend("Oi", "Escreva uma mensagem...");

    expect(await screen.findByText("Parci")).toBeInTheDocument();
    await waitFor(() => expect(useChatStore.getState().isReplying).toBe(false));
  });

  it("shows the empty state before any conversation is open", () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    expect(screen.getByText(/Comece a conversa/)).toBeInTheDocument();
  });

  it("keeps voice disabled for a text model and enables it for a voice model", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("text-1"));

    expect(screen.getByRole("button", { name: "Conversar por voz" })).toBeDisabled();

    pickModel("Modelo Voz");
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("live-1"));

    expect(screen.getByRole("button", { name: "Conversar por voz" })).not.toBeDisabled();
  });

  it("disables voice mode when no live-capable model exists", async () => {
    setModelCatalogGateway(fakeCatalog([textOnly]));
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );

    expect(screen.getByRole("button", { name: "Conversar por voz" })).toBeDisabled();
  });

  it("enters voice mode, auto-starts the session and shows the orb instead of the text input", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    const { container } = render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );

    goVoice();
    await waitFor(() => expect(useChatStore.getState().mode).toBe("voice"));
    expect(useChatStore.getState().selectedModelId).toBe("live-1");

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));
    expect(liveSpy.connects).toHaveLength(1);
    expect(micSpy.started).toBe(true);
    expect(sinkSpy.started).toBe(true);

    expect(container.querySelector("canvas")).not.toBeNull();
    expect(screen.queryByPlaceholderText("Fale ou escreva para a IA...")).toBeNull();
  });

  it("persists the conversation only after the first voice turn (not on voice entry)", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    await waitFor(() => expect(useChatStore.getState().models.length).toBeGreaterThan(0));
    expect(useChatStore.getState().activeConversationId).toBeNull();

    goVoice();

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));
    expect(micSpy.started).toBe(true);
    expect(useChatStore.getState().activeConversationId).toBeNull();

    liveSpy.callbacks?.onInputTranscript("olá");
    liveSpy.callbacks?.onTurnComplete();

    await waitFor(() => expect(useChatStore.getState().activeConversationId).toBe("c1"));
  });

  it("lets you instruct the agent on a draft, before starting a conversation", async () => {
    setConversationGateway(fakeGateway({ chunks: ["ok"] }));
    render(<ChatView />);

    expect(useChatStore.getState().activeConversationId).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Instruir agente" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByRole("textbox"), {
      target: { value: "Você é o Toby, um médico" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar instrução" }));

    await waitFor(() =>
      expect(useChatStore.getState().activeInstruction).toBe("Você é o Toby, um médico"),
    );
  });

  it("instructs the agent and reflects it on the active conversation", async () => {
    setConversationGateway(fakeGateway({ chunks: ["ok"] }));
    render(<ChatView />);

    typeAndSend("Oi", "Escreva uma mensagem...");
    await waitFor(() => expect(useChatStore.getState().activeConversationId).toBe("c1"));

    fireEvent.click(screen.getByRole("button", { name: "Instruir agente" }));
    const field = within(screen.getByRole("dialog")).getByRole("textbox");
    fireEvent.change(field, { target: { value: "Fale como um pirata" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar instrução" }));

    await waitFor(() =>
      expect(useChatStore.getState().activeInstruction).toBe("Fale como um pirata"),
    );
    expect(await screen.findByRole("button", { name: "Instruir agente" })).toHaveTextContent(
      "Agente instruído",
    );
  });

  it("passes the agent instruction into the live voice session", async () => {
    setConversationGateway(fakeGateway({ chunks: ["ok"] }));
    render(<ChatView />);

    typeAndSend("Oi", "Escreva uma mensagem...");
    await waitFor(() => expect(useChatStore.getState().activeConversationId).toBe("c1"));

    fireEvent.click(screen.getByRole("button", { name: "Instruir agente" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByRole("textbox"), {
      target: { value: "Seja conciso" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar instrução" }));
    await waitFor(() => expect(useChatStore.getState().activeInstruction).toBe("Seja conciso"));

    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    expect(liveSpy.connects[0]?.instruction).toBe("Seja conciso");
  });

  it("streams live captions and persists the completed voice turn", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );

    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    liveSpy.callbacks?.onAudioFrame(Int16Array.from([1, 2, 3]));
    expect(sinkSpy.enqueued).toBe(1);

    liveSpy.callbacks?.onInputTranscript("olá assistente");
    liveSpy.callbacks?.onOutputTranscript("olá, como vai?");
    expect(await screen.findByText("olá, como vai?")).toBeInTheDocument();

    liveSpy.callbacks?.onTurnComplete();

    await waitFor(() => expect(recordedTurns).toHaveLength(1));
    expect(recordedTurns[0]).toEqual([
      { role: "user", type: "voice", content: "olá assistente" },
      { role: "assistant", type: "voice", content: "olá, como vai?" },
    ]);
    expect((await screen.findAllByText("Sobre voz")).length).toBeGreaterThan(0);
  });

  it("sends typed text into the live session from the orb (text-to-voice)", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );

    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    typeAndSend("fale comigo", "Escreva para a IA...");

    await waitFor(() => expect(liveSpy.sentText).toContain("fale comigo"));
  });

  it("exits voice via the close button, returns to text mode and stops the session", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );

    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    fireEvent.click(screen.getByRole("button", { name: "Sair da voz" }));

    await waitFor(() => expect(useChatStore.getState().mode).toBe("text"));
    expect(micSpy.started).toBe(false);
    expect(await screen.findByPlaceholderText("Escreva uma mensagem...")).toBeInTheDocument();
  });

  it("barges in: stops playback when the user starts speaking", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );
    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    liveSpy.callbacks?.onAudioFrame(Int16Array.from([9]));
    await waitFor(() => expect(useChatStore.getState().isSpeaking).toBe(true));

    const stopsBefore = sinkSpy.stopped;
    liveSpy.callbacks?.onInputTranscript("espera");
    await waitFor(() => expect(useChatStore.getState().isSpeaking).toBe(false));
    expect(sinkSpy.stopped).toBeGreaterThan(stopsBefore);
  });

  it("ends the session and stops the mic when the live socket closes (no loop)", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("text-1"));
    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    liveSpy.callbacks?.onClose();

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("idle"));
    expect(micSpy.started).toBe(false);
  });

  it("shows a single error and stops the mic when the session errors repeatedly", async () => {
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("text-1"));
    goVoice();
    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("live"));

    liveSpy.callbacks?.onError(new Error("socket closed"));
    liveSpy.callbacks?.onError(new Error("socket closed again"));

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("error"));
    expect(micSpy.started).toBe(false);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it("flags an error when the live session fails to connect", async () => {
    liveSpy.failConnect = true;
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() =>
      expect(useChatStore.getState().selectedModelId).toBe("text-1"),
    );
    goVoice();

    await waitFor(() => expect(useChatStore.getState().liveStatus).toBe("error"));
    expect(recordedTurns).toHaveLength(0);
  });

  const lastNotification = () => {
    const { notifications } = useNotificationStore.getState();
    return notifications[notifications.length - 1];
  };

  it("notifies in Portuguese when the assistant reply fails", async () => {
    setConversationGateway(
      fakeGateway({ chunks: ["Parci", "al"], failAfterFirstChunk: true }),
    );
    render(<ChatView />);

    startConversation();
    await screen.findByPlaceholderText("Escreva uma mensagem...");
    typeAndSend("Oi", "Escreva uma mensagem...");

    await waitFor(() => expect(lastNotification()?.variant).toBe("danger"));
    expect(lastNotification()?.message).toBe("Não foi possível obter a resposta da IA. Tente novamente.");
  });

  it("notifies when the live session fails to connect", async () => {
    liveSpy.failConnect = true;
    setConversationGateway(fakeGateway({ chunks: [] }));
    render(<ChatView />);

    startConversation();
    await waitFor(() => expect(useChatStore.getState().selectedModelId).toBe("text-1"));
    goVoice();

    await waitFor(() => expect(lastNotification()?.variant).toBe("danger"));
    expect(lastNotification()?.message).toBe("Não foi possível iniciar a sessão de voz.");
  });

  it("degrades to text-only when the model catalog fails to load", async () => {
    setModelCatalogGateway({
      listModels: async () => {
        throw new Error("models unavailable");
      },
    });
    setConversationGateway(fakeGateway({ chunks: ["Olá"] }));
    render(<ChatView />);

    startConversation();
    await screen.findByPlaceholderText("Escreva uma mensagem...");

    expect(useChatStore.getState().models).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Conversar por voz" })).toBeDisabled();

    typeAndSend("Oi", "Escreva uma mensagem...");
    expect(await screen.findByText("Oi")).toBeInTheDocument();
  });
});
