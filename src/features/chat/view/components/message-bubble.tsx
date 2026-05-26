import { Bot, User } from "lucide-react";

import type { Message } from "../../model/message.model";
import { MessageMedia } from "./message-media";
import { TypingIndicator } from "./typing-indicator";

type MessageBubbleProps = { message: Message };

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";
  const media = (message.contents ?? []).filter(
    (content) => content.kind === "image" || content.kind === "video",
  );
  const hasText = message.content.length > 0;

  return (
    <div className={alignment(isUser)}>
      {!isUser && (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-raised text-accent">
          <Bot className="size-4" />
        </span>
      )}
      <div className={bubble(isUser)}>
        {hasText ? message.content : media.length === 0 ? <TypingIndicator /> : null}
        {media.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {media.map((content, index) => (
              <MessageMedia key={index} content={content} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-muted">
          <User className="size-4" />
        </span>
      )}
    </div>
  );
};

const alignment = (isUser: boolean) =>
  `flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`;

const bubble = (isUser: boolean) =>
  `max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
    isUser
      ? "rounded-br-sm bg-accent text-accent-ink"
      : "rounded-bl-sm bg-panel text-ink"
  }`;
