import { beforeEach, describe, expect, it } from "bun:test";

import type { AiModel } from "../../model/ai-model.model";
import type { ConversationSummary } from "../../model/conversation-summary.model";
import type { Message } from "../../model/message.model";
import { useChatStore } from "./chat.store";

const aModel = (id: string, capabilities: AiModel["capabilities"]): AiModel => ({
  id,
  label: id,
  capabilities,
  tier: "free",
});

const aMessage = (content: string): Message => ({
  id: content,
  role: "user",
  type: "text",
  content,
  createdAt: "2026-05-25T10:00:00.000Z",
});

const aSummary = (id: string): ConversationSummary => ({
  id,
  title: "Nova conversa",
  createdAt: "2026-05-25T10:00:00.000Z",
});

describe("chat store", () => {
  beforeEach(() =>
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
    }),
  );

  it("starts in text mode, idle, with no model selected", () => {
    expect(useChatStore.getState().mode).toBe("text");
    expect(useChatStore.getState().selectedModelId).toBeNull();
    expect(useChatStore.getState().liveStatus).toBe("idle");
  });

  it("sets the mode, the catalog and the selected model", () => {
    const { setMode, setModels, setSelectedModelId } = useChatStore.getState();

    setModels([aModel("a", ["text"]), aModel("b", ["text", "live"])]);
    setSelectedModelId("b");
    setMode("voice");

    const state = useChatStore.getState();
    expect(state.models).toHaveLength(2);
    expect(state.selectedModelId).toBe("b");
    expect(state.mode).toBe("voice");
  });

  it("tracks the live session lifecycle flags", () => {
    const { setLiveStatus, setListening, setSpeaking } = useChatStore.getState();

    setLiveStatus("connecting");
    setListening(true);
    setSpeaking(true);
    expect(useChatStore.getState().liveStatus).toBe("connecting");
    expect(useChatStore.getState().isListening).toBe(true);
    expect(useChatStore.getState().isSpeaking).toBe(true);

    setLiveStatus("live");
    setListening(false);
    setSpeaking(false);
    expect(useChatStore.getState().liveStatus).toBe("live");
    expect(useChatStore.getState().isListening).toBe(false);
    expect(useChatStore.getState().isSpeaking).toBe(false);
  });

  it("replaces messages when loading a conversation", () => {
    const { setMessages } = useChatStore.getState();

    setMessages([aMessage("oi"), aMessage("tudo bem?")]);

    expect(useChatStore.getState().messages).toEqual([
      aMessage("oi"),
      aMessage("tudo bem?"),
    ]);
  });

  it("appends a user message and an assistant draft with default values", () => {
    const { addUserMessage, startAssistantReply } = useChatStore.getState();

    addUserMessage("oi");
    startAssistantReply();

    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: "user", type: "text", content: "oi" });
    expect(messages[1]).toMatchObject({ role: "assistant", type: "text", content: "" });
  });

  it("streams chunks into the assistant draft", () => {
    const { startAssistantReply, appendReplyChunk } = useChatStore.getState();

    startAssistantReply();
    appendReplyChunk("Olá");
    appendReplyChunk(" mundo");

    expect(useChatStore.getState().messages[0].content).toBe("Olá mundo");
  });

  it("toggles isReplying", () => {
    useChatStore.getState().setReplying(true);
    expect(useChatStore.getState().isReplying).toBe(true);

    useChatStore.getState().setReplying(false);
    expect(useChatStore.getState().isReplying).toBe(false);
  });

  it("replaces the conversation list and tracks the active conversation", () => {
    const { setConversations, setActiveConversationId } = useChatStore.getState();

    setConversations([aSummary("a"), aSummary("b")]);
    setActiveConversationId("b");

    expect(useChatStore.getState().conversations).toEqual([
      aSummary("a"),
      aSummary("b"),
    ]);
    expect(useChatStore.getState().activeConversationId).toBe("b");
  });
});
