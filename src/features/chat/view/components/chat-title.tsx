"use client";

import { useChatStore } from "../../view-model/stores/chat.store";

export const ChatTitle = () => {
  const { conversations, activeConversationId } = useChatStore();
  const title =
    conversations.find((conversation) => conversation.id.value === activeConversationId)?.title ??
    "Nova conversa";

  return <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{title}</span>;
};
