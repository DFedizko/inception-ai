import { errorResponse } from "./error-response";

export const streamingTextResponse = (
  run: (onChunk: (chunk: string) => void) => Promise<void>,
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
          headers: { "Content-Type": "text/plain; charset=utf-8", ...extraHeaders },
        }),
      );
    };

    run((chunk) => {
      if (!streamStarted) {
        startStreaming();
      }
      streamController.enqueue(encoder.encode(chunk));
    })
      .then(() => {
        if (!streamStarted) {
          startStreaming();
        }
        streamController.close();
      })
      .catch((error) => {
        if (streamStarted) {
          streamController.close();
        } else {
          resolve(errorResponse(error));
        }
      });
  });
};
