import { useEffect } from "react";

import { notify } from "@/features/shared/ui/notification";
import { useVoiceRecorder } from "./audio/voice-recorder.provider";
import { conversationGateway } from "./gateways/conversation.gateway.provider";
import { modelCatalogGateway } from "./gateways/model-catalog.gateway.provider";
import { useLiveSession } from "./live/useLiveSession";
import { useGenerateImage } from "./mutation/useGenerateImage";
import { useGenerateImageFromVoice } from "./mutation/useGenerateImageFromVoice";
import { useGenerateVideo } from "./mutation/useGenerateVideo";
import { useInstructAgent } from "./mutation/useInstructAgent";
import { useSendMessage } from "./mutation/useSendMessage";
import { useGetConversation } from "./query/useGetConversation";
import { useListConversations } from "./query/useListConversations";
import { useListModels } from "./query/useListModels";
import { useChatStore, type Mode } from "./stores/chat.store";
import type { AiModel } from "../model/ai-model.model";

export const useChatViewModel = () => {
  const {
    activeConversationId,
    openingConversationId,
    isReplying,
    models,
    mode,
    selectedModelId,
    setActiveConversationId,
    setOpeningConversationId,
    setMessages,
    setReplying,
    setMode,
    setSelectedModelId,
    clearCaptions,
    setActiveInstruction,
  } = useChatStore();

  const gateway = conversationGateway();
  const catalog = modelCatalogGateway();
  const recorder = useVoiceRecorder();

  useListConversations(gateway);
  useListModels(catalog);
  const { conversation, error: conversationError } = useGetConversation(gateway, activeConversationId);

  const sendMutation = useSendMessage(gateway);
  const instructMutation = useInstructAgent(gateway);
  const imageMutation = useGenerateImage(gateway);
  const videoMutation = useGenerateVideo(gateway);
  const imageFromVoiceMutation = useGenerateImageFromVoice(gateway);

  const { startVoice, stopVoice, sendTextToVoice, toggleMicMute, getAudioLevel } =
    useLiveSession(gateway);

  const selectedModel = models.find((model) => model.id === selectedModelId) ?? null;
  const canUseVoice = selectedModel?.isLive() ?? false;
  const canGenerateImage = selectedModel?.canGenerateImage() ?? false;
  const canGenerateVideo = selectedModel?.canGenerateVideo() ?? false;

  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(defaultModelId(models, mode));
    }
  }, [models, selectedModelId, mode, setSelectedModelId]);

  useEffect(() => {
    setReplying(
      sendMutation.isPending ||
        imageMutation.isPending ||
        videoMutation.isPending ||
        imageFromVoiceMutation.isPending,
    );
  }, [
    sendMutation.isPending,
    imageMutation.isPending,
    videoMutation.isPending,
    imageFromVoiceMutation.isPending,
    setReplying,
  ]);

  useEffect(() => {
    if (!openingConversationId) return;
    if (conversationError) {
      setOpeningConversationId(null);
      return;
    }
    if (conversation && conversation.id.value === openingConversationId && !isReplying) {
      setMessages(conversation.messages);
      setActiveInstruction(conversation.instruction);
      setOpeningConversationId(null);
    }
  }, [
    conversation,
    conversationError,
    openingConversationId,
    isReplying,
    setMessages,
    setActiveInstruction,
    setOpeningConversationId,
  ]);

  const openConversation = (id: string) => {
    setActiveConversationId(id);
    setOpeningConversationId(id);
  };

  const startConversation = () => {
    void stopVoice();
    setActiveConversationId(null);
    setOpeningConversationId(null);
    setMessages([]);
    setActiveInstruction(null);
    clearCaptions();
    setMode("text");
  };

  const selectModel = (id: string) => {
    setSelectedModelId(id);
    const chosen = models.find((model) => model.id === id) ?? null;
    if (mode === "voice" && !chosen?.isLive()) setMode("text");
  };

  const changeMode = (next: Mode) => {
    if (next === "voice") {
      if (!canUseVoice) return;
    } else {
      void stopVoice();
    }
    setMode(next);
  };

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0 || isReplying) return;
    const wasDraft = !useChatStore.getState().activeConversationId;
    sendMutation.mutate(trimmed, {
      onSuccess: () => {
        if (wasDraft) applyPendingInstruction();
      },
    });
  };

  const applyPendingInstruction = () => {
    const conversationId = useChatStore.getState().activeConversationId;
    const pending = useChatStore.getState().activeInstruction;
    if (!conversationId || !pending) return;
    instructMutation.mutate({ conversationId, instruction: pending });
  };

  const instructAgent = (instruction: string) => {
    const trimmed = instruction.trim();
    if (trimmed.length === 0) return;
    const conversationId = useChatStore.getState().activeConversationId;
    if (!conversationId) {
      setActiveInstruction(trimmed);
      notify.success("Instrução salva. Vai valer assim que a conversa começar.");
      return;
    }
    instructMutation.mutate({ conversationId, instruction: trimmed });
  };

  const generateImage = (prompt: string) => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || isReplying) return;
    imageMutation.mutate({ conversationId: useChatStore.getState().activeConversationId, prompt: trimmed });
  };

  const generateVideo = (prompt: string) => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || isReplying) return;
    notify.info("Gerando vídeo… isso pode levar alguns minutos.");
    videoMutation.mutate({ conversationId: useChatStore.getState().activeConversationId, prompt: trimmed });
  };

  const recordImagePrompt = () => {
    if (!recorder.isRecording) {
      recorder.start().catch(() => notify.danger("Não foi possível acessar o microfone."));
      return;
    }
    recorder
      .stop()
      .then((audio) =>
        imageFromVoiceMutation.mutate({
          conversationId: useChatStore.getState().activeConversationId,
          audio,
        }),
      )
      .catch(() => notify.danger("Não foi possível capturar o áudio."));
  };

  return {
    canUseVoice,
    canGenerateImage,
    canGenerateVideo,
    selectedModel,
    openConversation,
    startConversation,
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
    toggleMicMute,
    instructAgent,
    getAudioLevel,
  };
};

const defaultModelId = (models: AiModel[], mode: Mode): string => {
  if (mode === "voice") {
    const liveModel = models.find((model) => model.isLive());
    if (liveModel) return liveModel.id;
  }
  return (models.find((model) => model.isTextCapable()) ?? models[0]).id;
};
