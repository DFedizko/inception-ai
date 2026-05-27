"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowUp, Loader2, Mic, MicOff, X } from "lucide-react";

import { VoiceOrb, type VoiceOrbState } from "@/features/shared/ui/voice-orb/voice-orb";
import { Tooltip } from "@/features/shared/ui";
import { useChatStore } from "../../view-model/stores/chat.store";
import { useChatViewModel } from "../../view-model/useChatViewModel";

export const VoiceOrbStage = () => {
  const [draft, setDraft] = useState("");
  const { liveStatus, isListening, isSpeaking, isMicMuted, userCaption, assistantCaption } =
    useChatStore();
  const { startVoice, stopVoice, changeMode, toggleMicMute, getAudioLevel, sendTextToVoice } =
    useChatViewModel();

  useEffect(() => {
    void startVoice();
    return () => {
      void stopVoice();
    };
  }, []);

  const orbState = orbStateFrom(isListening, isSpeaking);
  const liveOn = liveStatus === "live";
  const sendBlockedReason = !liveOn
    ? "Aguarde a sessão de voz conectar"
    : draft.trim().length === 0
      ? "Escreva uma mensagem para enviar"
      : undefined;

  const submit = () => {
    if (draft.trim().length === 0 || !liveOn) return;
    void sendTextToVoice(draft);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-6">
      <button
        type="button"
        onClick={toggleMicMute}
        aria-label={isMicMuted ? "Ativar microfone" : "Silenciar microfone"}
        aria-pressed={isMicMuted}
        className={`absolute left-4 top-4 flex size-9 items-center justify-center rounded-full border border-line transition ${
          isMicMuted ? "bg-danger/15 text-danger" : "bg-panel text-ink-muted hover:text-ink"
        }`}
      >
        {isMicMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </button>

      <button
        type="button"
        onClick={() => changeMode("text")}
        aria-label="Sair da voz"
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-line bg-panel text-ink-muted transition hover:text-ink"
      >
        <X className="size-5" />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="size-72 sm:size-80">
          <VoiceOrb getAudioLevel={getAudioLevel} state={orbState} />
        </div>

        <div className="flex min-h-12 max-w-md flex-col items-center gap-1 text-center" aria-live="polite">
          {assistantCaption.trim().length > 0 && <p className="text-lg text-ink">{assistantCaption}</p>}
          {userCaption.trim().length > 0 && (
            <p className="text-sm text-ink-muted">Você: {userCaption}</p>
          )}
          {assistantCaption.trim().length === 0 &&
            userCaption.trim().length === 0 &&
            liveStatus === "live" && (
              <p className="text-lg text-ink-muted">
                {isMicMuted ? "Microfone silenciado" : "Estou ouvindo..."}
              </p>
            )}
        </div>

        {liveStatus === "connecting" && (
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Loader2 className="size-3.5 animate-spin text-accent" />
            Conectando...
          </span>
        )}
        {liveStatus === "error" && (
          <span className="text-xs text-accent">
            Falha na sessão de voz. Toque em sair e tente de novo.
          </span>
        )}
      </div>

      <div className="flex w-full max-w-md items-end gap-2 rounded-2xl border border-line bg-panel px-3 py-2 focus-within:border-accent">
        <textarea
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={!liveOn}
          placeholder="Escreva para a IA..."
          className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted disabled:cursor-not-allowed"
        />
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

const orbStateFrom = (isListening: boolean, isSpeaking: boolean): VoiceOrbState => {
  if (isSpeaking) return "speaking";
  if (isListening) return "listening";
  return "idle";
};
