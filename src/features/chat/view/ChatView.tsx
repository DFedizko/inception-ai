import { BaseLayout } from "@/features/shared/ui";
import { ChatBody } from "./components/chat-body";
import { ChatHeader } from "./components/chat-header";
import { ConversationSidebar } from "./components/conversation-sidebar";

export const ChatView = () => (
  <BaseLayout sidebar={<ConversationSidebar />}>
    <section className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
      <ChatHeader />
      <ChatBody />
    </section>
  </BaseLayout>
);
