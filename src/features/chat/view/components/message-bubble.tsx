import type { Message } from "../../model/message.model";
import { MessageMedia } from "./message-media";
import { TypingIndicator } from "./typing-indicator";

type MessageBubbleProps = { message: Message };

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  if (message.isFromUser()) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent px-4 py-3 text-sm leading-relaxed text-accent-ink">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed text-ink">
      {message.hasThinking() && (
        <p className="whitespace-pre-wrap border-l-2 border-line pl-3 italic text-ink-muted">
          {message.thinking}
        </p>
      )}
      {message.hasText() && <div className="whitespace-pre-wrap">{message.content}</div>}
      {isAwaiting(message) && <TypingIndicator />}
      {message.media().length > 0 && (
        <div className="mt-1 flex flex-col gap-2">
          {message.media().map((content, index) => (
            <MessageMedia key={index} content={content} />
          ))}
        </div>
      )}
    </div>
  );
};

const isAwaiting = (message: Message) =>
  !message.hasText() && !message.hasThinking() && message.media().length === 0;
