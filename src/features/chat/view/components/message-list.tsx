"use client";

import { useEffect, useRef } from "react";
import { MessagesSquare } from "lucide-react";

import { useChatStore } from "../../view-model/stores/chat.store";
import { MessageBubble } from "./message-bubble";
import { MessageListSkeleton } from "./message-list-skeleton";

export const MessageList = () => {
  const { messages, isLoadingMessages } = useChatStore();
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anchor.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoadingMessages && messages.length === 0) return <MessageListSkeleton />;
  if (messages.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={anchor} />
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-ink-muted">
    <MessagesSquare className="size-8 text-accent" />
    <p className="max-w-xs text-sm">
      Comece a conversa: digite uma mensagem e veja a resposta chegar em
      streaming.
    </p>
  </div>
);
