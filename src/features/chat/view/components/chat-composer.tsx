"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import {
  ArrowUp,
  AudioLines,
  Film,
  Image as ImageIcon,
  Mic,
  Square,
} from "lucide-react";

import { Tooltip } from "@/features/shared/ui";
import type { AiModel } from "../../model/ai-model.model";
import { useChatStore } from "../../view-model/stores/chat.store";
import { useChatViewModel } from "../../view-model/useChatViewModel";
import { ModelSelector } from "./model-selector";

export const ChatComposer = () => {
  const [draft, setDraft] = useState("");
  const { isReplying, models } = useChatStore();
  const {
    sendMessage,
    generateImage,
    generateVideo,
    recordImagePrompt,
    isRecordingImagePrompt,
    changeMode,
    canUseVoice,
    canGenerateImage,
    canGenerateVideo,
  } = useChatViewModel();

  const sendBlockedReason = reasonSendDisabled({ isReplying, draft });
  const imageBlockedReason = reasonMediaDisabled({
    capable: canGenerateImage,
    isReplying,
    draft,
    noun: "imagem",
  });
  const videoBlockedReason = reasonMediaDisabled({
    capable: canGenerateVideo,
    isReplying,
    draft,
    noun: "vídeo",
  });
  const voiceBlockedReason = reasonVoiceDisabled(canUseVoice, models);
  const recordBlockedReason = reasonRecordDisabled({
    capable: canGenerateImage,
    isReplying,
  });

  const submit = () => {
    if (sendBlockedReason !== undefined) return;
    void sendMessage(draft);
    setDraft("");
  };

  const submitImage = () => {
    if (imageBlockedReason !== undefined) return;
    void generateImage(draft);
    setDraft("");
  };

  const submitVideo = () => {
    if (videoBlockedReason !== undefined) return;
    void generateVideo(draft);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-line bg-base/90 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-end gap-2">
        <ModelSelector />
      </div>
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-panel px-3 py-2 focus-within:border-accent">
        <Tooltip label={voiceBlockedReason} placement="top">
          <button
            type="button"
            onClick={() => changeMode("voice")}
            disabled={voiceBlockedReason !== undefined}
            aria-label="Conversar por voz"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5be7ff] via-[#6d6bff] to-[#a06bff] text-white shadow-[0_0_12px_rgba(109,107,255,0.5)] transition hover:brightness-110 disabled:from-line disabled:via-line disabled:to-line disabled:text-ink-muted disabled:shadow-none"
          >
            <AudioLines className="size-4" />
          </button>
        </Tooltip>
        <textarea
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escreva uma mensagem..."
          className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted disabled:cursor-not-allowed"
        />
        <Tooltip
          label={imageBlockedReason ?? "Gerar imagem a partir do texto"}
          placement="top"
        >
          <button
            type="button"
            onClick={submitImage}
            disabled={imageBlockedReason !== undefined}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:text-ink disabled:opacity-40"
            aria-label="Gerar imagem"
          >
            <ImageIcon className="size-5" />
          </button>
        </Tooltip>
        <Tooltip
          label={videoBlockedReason ?? "Gerar vídeo a partir do texto"}
          placement="top"
        >
          <button
            type="button"
            onClick={submitVideo}
            disabled={videoBlockedReason !== undefined}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:text-ink disabled:opacity-40"
            aria-label="Gerar vídeo"
          >
            <Film className="size-5" />
          </button>
        </Tooltip>
        <Tooltip
          label={
            isRecordingImagePrompt
              ? "Parar e gerar a imagem"
              : (recordBlockedReason ?? "Gravar voz para gerar imagem")
          }
          placement="top"
        >
          <button
            type="button"
            onClick={() => void recordImagePrompt()}
            disabled={
              recordBlockedReason !== undefined && !isRecordingImagePrompt
            }
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 ${
              isRecordingImagePrompt
                ? "text-danger"
                : "text-ink-muted hover:text-ink"
            }`}
            aria-label={
              isRecordingImagePrompt
                ? "Parar gravação"
                : "Gravar voz para gerar imagem"
            }
          >
            {isRecordingImagePrompt ? (
              <Square className="size-5" />
            ) : (
              <Mic className="size-5" />
            )}
          </button>
        </Tooltip>
        <Tooltip label={sendBlockedReason} placement="top">
          <button
            type="button"
            onClick={submit}
            disabled={sendBlockedReason !== undefined}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink transition disabled:opacity-40"
            aria-label="Enviar"
          >
            <ArrowUp className="size-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

type SendState = { isReplying: boolean; draft: string };

const reasonSendDisabled = ({
  isReplying,
  draft,
}: SendState): string | undefined => {
  if (isReplying) return "Aguarde a IA terminar de responder";
  if (draft.trim().length === 0) return "Escreva uma mensagem para enviar";
  return undefined;
};

const reasonRecordDisabled = ({
  capable,
  isReplying,
}: {
  capable: boolean;
  isReplying: boolean;
}): string | undefined => {
  if (!capable) return "O modelo selecionado não gera imagem";
  if (isReplying) return "Aguarde a IA terminar";
  return undefined;
};

type MediaState = {
  capable: boolean;
  isReplying: boolean;
  draft: string;
  noun: string;
};

const reasonMediaDisabled = ({
  capable,
  isReplying,
  draft,
  noun,
}: MediaState): string | undefined => {
  if (!capable) return `O modelo selecionado não gera ${noun}`;
  if (isReplying) return "Aguarde a IA terminar de responder";
  if (draft.trim().length === 0) return "Escreva um prompt para gerar";
  return undefined;
};

const reasonVoiceDisabled = (canUseVoice: boolean, models: AiModel[]): string | undefined => {
  if (canUseVoice) return undefined;
  if (models.length === 0) return "Nenhum modelo disponível no momento";
  if (!models.some((model) => model.isLive())) return "Nenhum modelo suporta voz";
  return "O modelo selecionado não suporta voz — escolha um modelo de voz";
};
