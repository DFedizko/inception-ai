"use client";

import { useChatStore } from "../../view-model/stores/chat.store";
import { AgentInstruction } from "./agent-instruction";

export const ChatHeader = () => {
  const { conversations, activeConversationId } = useChatStore();
  const title =
    conversations.find((conversation) => conversation.id === activeConversationId)?.title ??
    "Nova conversa";

  return (
    <header className="flex items-center gap-3 border-b border-line px-6 py-4">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{title}</span>
      <AgentInstruction />
    </header>
  );
};
