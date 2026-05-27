"use client";

import { useChatStore } from "../../view-model/stores/chat.store";
import { ChatComposer } from "./chat-composer";
import { MessageList } from "./message-list";
import { VoiceOrbStage } from "./voice-orb-stage";

export const ChatBody = () => {
  const { mode } = useChatStore();

  if (mode === "voice") return <VoiceOrbStage />;

  return (
    <>
      <MessageList />
      <ChatComposer />
    </>
  );
};
