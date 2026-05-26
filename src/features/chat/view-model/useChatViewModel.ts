import { useRef } from "react";

import { notify } from "@/features/shared/ui/notification";
import { useAudioSink, useMicStream } from "./audio/audio.provider";
import { useVoiceRecorder } from "./audio/voice-recorder.provider";
import { conversationGateway } from "./gateways/conversation.gateway.provider";
import type { TurnInput } from "./gateways/conversation.gateway";
import { modelCatalogGateway } from "./gateways/model-catalog.gateway.provider";
import { liveSessionConnector } from "./live/live-session.provider";
import type { LiveSession } from "./live/live-session.port";
import { useChatStore, type LiveStatus, type Mode } from "./stores/chat.store";
import type { AiModel } from "../model/ai-model.model";

type TurnBuffer = { input: string; output: string };

export const useChatViewModel = () => {
  const {
    activeConversationId,
    isReplying,
    messages,
    mode,
    models,
    selectedModelId,
    setConversations,
    setLoadingConversations,
    setActiveConversationId,
    setMessages,
    setLoadingMessages,
    addUserMessage,
    startAssistantReply,
    appendReplyChunk,
    setReplying,
    setMode,
    setModels,
    setLoadingModels,
    setSelectedModelId,
    setLiveStatus,
    setListening,
    setSpeaking,
    setUserCaption,
    setAssistantCaption,
    clearCaptions,
    setActiveInstruction,
  } = useChatStore();

  const gateway = conversationGateway();
  const catalog = modelCatalogGateway();
  const connector = liveSessionConnector();
  const mic = useMicStream();
  const sink = useAudioSink();
  const recorder = useVoiceRecorder();

  const session = useRef<LiveSession | null>(null);
  const turn = useRef<TurnBuffer>({ input: "", output: "" });
  const ending = useRef(false);

  const selectedModel = models.find((model) => model.id === selectedModelId) ?? null;
  const canUseVoice = isLive(selectedModel);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      setConversations(await gateway.listConversations());
    } finally {
      setLoadingConversations(false);
    }
  };

  const openConversation = async (id: string) => {
    setActiveConversationId(id);
    setLoadingMessages(true);
    try {
      const conversation = await gateway.getConversation(id);
      setMessages(conversation.messages);
      setActiveInstruction(conversation.instruction);
    } catch {
      notify.danger("Não foi possível abrir esta conversa.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const startDraft = () => {
    if (session.current) void stopVoice();
    setActiveConversationId(null);
    setMessages([]);
    setActiveInstruction(null);
    clearCaptions();
    setMode("text");
  };

  const instructAgent = async (instruction: string) => {
    const trimmed = instruction.trim();
    if (trimmed.length === 0) return;
    const conversationId = useChatStore.getState().activeConversationId;
    if (!conversationId) {
      setActiveInstruction(trimmed);
      notify.success("Instrução salva. Vai valer assim que a conversa começar.");
      return;
    }
    try {
      const conversation = await gateway.instructAgent(conversationId, trimmed);
      setActiveInstruction(conversation.instruction);
      notify.success("Instrução do agente salva.");
    } catch {
      notify.danger("Não foi possível salvar a instrução do agente.");
    }
  };

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const catalogModels = await catalog.listModels();
      setModels(catalogModels);
      if (!selectedModelId && catalogModels.length > 0) {
        setSelectedModelId(defaultModelId(catalogModels, mode));
      }
    } catch {
      setModels([]);
      notify.danger("Não foi possível carregar os modelos de IA.");
    } finally {
      setLoadingModels(false);
    }
  };

  const selectModel = (id: string) => {
    setSelectedModelId(id);
    const chosen = models.find((model) => model.id === id) ?? null;
    if (mode === "voice" && !isLive(chosen)) setMode("text");
  };

  const changeMode = (next: Mode) => {
    if (next === "voice") {
      if (!canUseVoice) return;
    } else if (session.current) {
      void stopVoice();
    }
    setMode(next);
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0 || isReplying) return;

    setReplying(true);
    addUserMessage(trimmed);
    startAssistantReply();

    const wasDraft = !activeConversationId;
    try {
      const reply = activeConversationId
        ? gateway.streamAssistantReply(activeConversationId, trimmed)
        : gateway.beginConversation(trimmed, (id) => setActiveConversationId(id));
      for await (const chunk of reply) {
        appendReplyChunk(chunk);
      }
    } catch {
      notify.danger("Não foi possível obter a resposta da IA. Tente novamente.");
    }

    if (wasDraft) await attachPendingInstruction();
    setReplying(false);
    await loadConversations();
  };

  const attachPendingInstruction = async () => {
    const conversationId = useChatStore.getState().activeConversationId;
    const pending = useChatStore.getState().activeInstruction;
    if (!conversationId || !pending) return;
    try {
      await gateway.instructAgent(conversationId, pending);
    } catch {
      notify.danger("Não foi possível aplicar a instrução do agente nesta conversa.");
    }
  };

  const generateImage = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || isReplying || !activeConversationId) return;

    setReplying(true);
    try {
      const conversation = await gateway.generateImage(activeConversationId, trimmed);
      setMessages(conversation.messages);
      await loadConversations();
    } catch {
      notify.danger("Não foi possível gerar a imagem.");
    }
    setReplying(false);
  };

  const generateVideo = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || isReplying || !activeConversationId) return;

    setReplying(true);
    notify.info("Gerando vídeo… isso pode levar alguns minutos.");
    try {
      const conversation = await gateway.generateVideo(activeConversationId, trimmed);
      setMessages(conversation.messages);
      await loadConversations();
    } catch {
      notify.danger("Não foi possível gerar o vídeo.");
    }
    setReplying(false);
  };

  const recordImagePrompt = async () => {
    if (!activeConversationId) return;

    if (!recorder.isRecording) {
      try {
        await recorder.start();
      } catch {
        notify.danger("Não foi possível acessar o microfone.");
      }
      return;
    }

    let audio;
    try {
      audio = await recorder.stop();
    } catch {
      notify.danger("Não foi possível capturar o áudio.");
      return;
    }

    setReplying(true);
    try {
      const conversation = await gateway.generateImageFromVoice(activeConversationId, audio);
      setMessages(conversation.messages);
      await loadConversations();
    } catch {
      notify.danger("Não foi possível gerar a imagem por voz.");
    }
    setReplying(false);
  };

  const startVoice = async () => {
    if (!canUseVoice || session.current) return;
    ending.current = false;
    setLiveStatus("connecting");
    try {
      const { token, model } = await gateway.issueLiveToken();
      session.current = await connector.connect(
        {
          token,
          model,
          history: historyFromMessages(messages),
          instruction: useChatStore.getState().activeInstruction ?? undefined,
        },
        {
          onAudioFrame: (pcm) => {
            setSpeaking(true);
            sink.enqueue(pcm);
          },
          onInputTranscript: (text) => {
            bargeIn();
            if (turn.current.input.length === 0) setAssistantCaption("");
            turn.current.input += text;
            setUserCaption(turn.current.input);
          },
          onOutputTranscript: (text) => {
            turn.current.output += text;
            setAssistantCaption(turn.current.output);
          },
          onTurnComplete: () => {
            setSpeaking(false);
            setUserCaption("");
            void persistTurn();
          },
          onInterrupted: bargeIn,
          onError: () => {
            void finishSession("error", "A sessão de voz caiu. Toque na bolinha para tentar de novo.");
          },
          onClose: () => {
            void finishSession("idle");
          },
        },
      );
      sink.start();
      await mic.start((frame) => {
        try {
          session.current?.sendAudioFrame(frame);
        } catch {
          void finishSession("error", "A sessão de voz caiu. Toque na bolinha para tentar de novo.");
        }
      });
      setListening(true);
      setLiveStatus("live");
    } catch {
      await finishSession("error", "Não foi possível iniciar a sessão de voz.");
    }
  };

  const finishSession = async (status: LiveStatus, message?: string) => {
    if (ending.current) return;
    ending.current = true;
    await teardown();
    setLiveStatus(status);
    if (message) notify.danger(message);
  };

  const stopVoice = async () => {
    await finishSession("idle");
  };

  const sendTextToVoice = async (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    if (!session.current) await startVoice();
    if (!session.current) return;
    turn.current.input += trimmed;
    session.current.sendText(trimmed);
  };

  const refreshActiveConversation = async () => {
    if (!activeConversationId) return;
    const conversation = await gateway.getConversation(activeConversationId);
    setMessages(conversation.messages);
    setActiveInstruction(conversation.instruction);
    await loadConversations();
  };

  const persistTurn = async () => {
    const conversationId = useChatStore.getState().activeConversationId;
    const turns = turnsFromBuffer(turn.current);
    turn.current = { input: "", output: "" };
    if (turns.length === 0) return;
    try {
      const conversation = conversationId
        ? await gateway.recordTurns(conversationId, turns)
        : await gateway.beginConversationWithTurns(turns);
      setActiveConversationId(conversation.id);
      setMessages(conversation.messages);
      await loadConversations();
    } catch {
      await refreshActiveConversation();
    }
  };

  const bargeIn = () => {
    if (useChatStore.getState().isSpeaking) {
      sink.stop();
      sink.start();
      setSpeaking(false);
    }
  };

  const getAudioLevel = () =>
    useChatStore.getState().isSpeaking ? sink.getLevel() : mic.getLevel();

  const teardown = async () => {
    await mic.stop();
    sink.stop();
    setListening(false);
    setSpeaking(false);
    clearCaptions();
    const active = session.current;
    session.current = null;
    if (active) await active.close();
  };

  return {
    canUseVoice,
    selectedModel,
    loadConversations,
    openConversation,
    startConversation: startDraft,
    loadModels,
    selectModel,
    changeMode,
    sendMessage,
    generateImage,
    generateVideo,
    recordImagePrompt,
    isRecordingImagePrompt: recorder.isRecording,
    startVoice,
    stopVoice,
    sendTextToVoice,
    getAudioLevel,
    instructAgent,
  };
};

const isLive = (model: AiModel | null): boolean =>
  model?.capabilities.includes("live") ?? false;

const defaultModelId = (models: AiModel[], mode: Mode): string => {
  if (mode === "voice") {
    const liveModel = models.find((model) => model.capabilities.includes("live"));
    if (liveModel) return liveModel.id;
  }
  return (models.find((model) => model.capabilities.includes("text")) ?? models[0]).id;
};

const historyFromMessages = (messages: { role: "user" | "assistant"; content: string }[]) =>
  messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({ role: message.role, content: message.content }));

const turnsFromBuffer = (buffer: { input: string; output: string }): TurnInput[] => {
  const turns: TurnInput[] = [];
  if (buffer.input.trim().length > 0) {
    turns.push({ role: "user", type: "voice", content: buffer.input.trim() });
  }
  if (buffer.output.trim().length > 0) {
    turns.push({ role: "assistant", type: "voice", content: buffer.output.trim() });
  }
  return turns;
};
