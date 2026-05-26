import { useRef, useState } from "react";

export type RecordedAudio = { data: string; mimeType: string };

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  const start = async (): Promise<void> => {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.current = media;
    chunks.current = [];
    const mediaRecorder = new MediaRecorder(media);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    mediaRecorder.start();
    recorder.current = mediaRecorder;
    setIsRecording(true);
  };

  const stop = async (): Promise<RecordedAudio> => {
    const mediaRecorder = recorder.current;
    if (!mediaRecorder) {
      throw new Error("Voice recorder was not started.");
    }
    const stopped = new Promise<void>((resolve) => {
      mediaRecorder.addEventListener("stop", () => resolve(), { once: true });
    });
    mediaRecorder.stop();
    await stopped;
    stream.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);

    const mimeType = mediaRecorder.mimeType || "audio/webm";
    const blob = new Blob(chunks.current, { type: mimeType });
    return { data: await toBase64(blob), mimeType };
  };

  return { isRecording, start, stop };
};

const toBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(blob);
  });
