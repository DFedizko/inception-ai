import type { ReplyChunk, ReplyChunkListener } from "@/bounded-contexts/conversation/application/ports/ai-provider";
import { errorResponse } from "./error-response";

export const streamingReplyResponse = (
  run: (onChunk: ReplyChunkListener) => Promise<void>,
  extraHeaders: Record<string, string> = {},
): Promise<Response> => {
  const encoder = new TextEncoder();

  return new Promise((resolve) => {
    let streamStarted = false;
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        streamController = controller;
      },
    });

    const startStreaming = () => {
      streamStarted = true;
      resolve(
        new Response(body, {
          headers: { "Content-Type": "application/x-ndjson; charset=utf-8", ...extraHeaders },
        }),
      );
    };

    const pushToClient = (chunk: ReplyChunk) => {
      if (!streamStarted) {
        startStreaming();
      }
      enqueueSafely(streamController, encoder.encode(`${JSON.stringify(chunk)}\n`));
    };

    run(pushToClient)
      .then(() => {
        if (!streamStarted) {
          startStreaming();
        }
        closeSafely(streamController);
      })
      .catch((error) => {
        if (streamStarted) {
          closeSafely(streamController);
        } else {
          resolve(errorResponse(error));
        }
      });
  });
};

const enqueueSafely = (
  controller: ReadableStreamDefaultController<Uint8Array>,
  chunk: Uint8Array,
): void => {
  try {
    controller.enqueue(chunk);
  } catch {
    return;
  }
};

const closeSafely = (controller: ReadableStreamDefaultController<Uint8Array>): void => {
  try {
    controller.close();
  } catch {
    return;
  }
};
