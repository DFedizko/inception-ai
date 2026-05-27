import { create } from "zustand";

import { UUID } from "@/features/shared/value-objects/uuid";
import type { AiModel } from "../../model/ai-model.model";
import type { ConversationSummary } from "../../model/conversation-summary.model";
import { Message } from "../../model/message.model";

export type Mode = "text" | "voice";

export type LiveStatus = "idle" | "connecting" | "live" | "error";

type ChatStore = {
  conversations: ConversationSummary[];
  isLoadingConversations: boolean;
  activeConversationId: string | null;
  openingConversationId: string | null;
  messages: Message[];
  isLoadingMessages: boolean;
  isReplying: boolean;
  mode: Mode;
  models: AiModel[];
  isLoadingModels: boolean;
  selectedModelId: string | null;
  liveStatus: LiveStatus;
  isListening: boolean;
  isSpeaking: boolean;
  isMicMuted: boolean;
  userCaption: string;
  assistantCaption: string;
  activeInstruction: string | null;
  setConversations: (conversations: ConversationSummary[]) => void;
  setLoadingConversations: (isLoadingConversations: boolean) => void;
  setActiveConversationId: (activeConversationId: string | null) => void;
  setOpeningConversationId: (openingConversationId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  setLoadingMessages: (isLoadingMessages: boolean) => void;
  addUserMessage: (content: string) => void;
  startAssistantReply: () => void;
  appendReplyChunk: (chunk: string) => void;
  appendThoughtChunk: (chunk: string) => void;
  setReplying: (isReplying: boolean) => void;
  setMode: (mode: Mode) => void;
  setModels: (models: AiModel[]) => void;
  setLoadingModels: (isLoadingModels: boolean) => void;
  setSelectedModelId: (selectedModelId: string | null) => void;
  setLiveStatus: (liveStatus: LiveStatus) => void;
  setListening: (isListening: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setMicMuted: (isMicMuted: boolean) => void;
  setUserCaption: (userCaption: string) => void;
  setAssistantCaption: (assistantCaption: string) => void;
  clearCaptions: () => void;
  setActiveInstruction: (activeInstruction: string | null) => void;
};

const appendChunkToLast = (messages: Message[], chunk: string): Message[] =>
  messages.map((message, index) =>
    index === messages.length - 1 ? message.withAppended(chunk) : message,
  );

const appendThoughtToLast = (messages: Message[], chunk: string): Message[] =>
  messages.map((message, index) =>
    index === messages.length - 1 ? message.withAppendedThought(chunk) : message,
  );

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  isLoadingConversations: false,
  activeConversationId: null,
  openingConversationId: null,
  messages: [],
  isLoadingMessages: false,
  isReplying: false,
  mode: "text",
  models: [],
  isLoadingModels: false,
  selectedModelId: null,
  liveStatus: "idle",
  isListening: false,
  isSpeaking: false,
  isMicMuted: false,
  userCaption: "",
  assistantCaption: "",
  activeInstruction: null,
  setConversations: (conversations) => set({ conversations }),
  setLoadingConversations: (isLoadingConversations) => set({ isLoadingConversations }),
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setOpeningConversationId: (openingConversationId) => set({ openingConversationId }),
  setMessages: (messages) => set({ messages }),
  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        new Message(
          UUID.create(crypto.randomUUID()),
          "user",
          "text",
          content,
          new Date().toISOString(),
        ),
      ],
    })),
  startAssistantReply: () =>
    set((state) => ({
      messages: [
        ...state.messages,
        new Message(
          UUID.create(crypto.randomUUID()),
          "assistant",
          "text",
          "",
          new Date().toISOString(),
        ),
      ],
    })),
  appendReplyChunk: (chunk) =>
    set((state) => ({ messages: appendChunkToLast(state.messages, chunk) })),
  appendThoughtChunk: (chunk) =>
    set((state) => ({ messages: appendThoughtToLast(state.messages, chunk) })),
  setReplying: (isReplying) => set({ isReplying }),
  setMode: (mode) => set({ mode }),
  setModels: (models) => set({ models }),
  setLoadingModels: (isLoadingModels) => set({ isLoadingModels }),
  setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
  setLiveStatus: (liveStatus) => set({ liveStatus }),
  setListening: (isListening) => set({ isListening }),
  setMicMuted: (isMicMuted) => set({ isMicMuted }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setUserCaption: (userCaption) => set({ userCaption }),
  setAssistantCaption: (assistantCaption) => set({ assistantCaption }),
  clearCaptions: () => set({ userCaption: "", assistantCaption: "" }),
  setActiveInstruction: (activeInstruction) => set({ activeInstruction }),
}));
