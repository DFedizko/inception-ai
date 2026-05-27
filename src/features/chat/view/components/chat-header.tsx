import { AgentInstruction } from "./agent-instruction";
import { ChatTitle } from "./chat-title";

export const ChatHeader = () => (
  <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-base/90 px-6 py-4 backdrop-blur-sm">
    <ChatTitle />
    <AgentInstruction />
  </header>
);
