"use client";

import { Plus, MessageSquare, Sparkles } from "lucide-react";

import { Sidebar, SidebarHeader, SidebarSection, SidebarItem } from "@/features/shared/ui";
import { useChatStore } from "../../view-model/stores/chat.store";
import { useChatViewModel } from "../../view-model/useChatViewModel";
import { ConversationListSkeleton } from "./conversation-list-skeleton";

export const ConversationSidebar = () => {
  const { conversations, isLoadingConversations, activeConversationId } = useChatStore();
  const { openConversation, startConversation } = useChatViewModel();

  return (
    <Sidebar>
      <SidebarHeader icon={<Sparkles className="size-4" />} title="Chat" />
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={startConversation}
          className="flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Nova conversa
        </button>
      </div>
      <SidebarSection label="Conversas" className="flex-1 overflow-y-auto pb-4">
        {isLoadingConversations && conversations.length === 0 ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <p className="px-3 py-2 text-xs text-ink-muted">Nenhuma conversa ainda.</p>
        ) : (
          conversations.map((conversation) => (
            <SidebarItem
              key={conversation.id.value}
              icon={<MessageSquare className="size-4 shrink-0 text-ink-muted" />}
              active={conversation.id.value === activeConversationId}
              onClick={() => openConversation(conversation.id.value)}
            >
              {labelOf(conversation.title)}
            </SidebarItem>
          ))
        )}
      </SidebarSection>
    </Sidebar>
  );
};

const labelOf = (title: string) => (title.trim().length > 0 ? title : "Nova conversa");
