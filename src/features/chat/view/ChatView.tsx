"use client";

import { BaseLayout } from "@/features/shared/ui";
import { useChatStore } from "../view-model/stores/chat.store";
import { ConversationSidebar } from "./components/conversation-sidebar";
import { ChatHeader } from "./components/chat-header";
import { MessageList } from "./components/message-list";
import { ChatComposer } from "./components/chat-composer";
import { VoiceOrbStage } from "./components/voice-orb-stage";

export const ChatView = () => {
  const { mode } = useChatStore();

  return (
    <BaseLayout sidebar={<ConversationSidebar />}>
      <section className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <ChatHeader />
        {mode === "voice" ? (
          <VoiceOrbStage />
        ) : (
          <>
            <MessageList />
            <ChatComposer />
          </>
        )}
      </section>
    </BaseLayout>
  );
};
