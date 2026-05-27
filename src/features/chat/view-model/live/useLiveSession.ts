import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import { useAudioSink, useMicStream } from "../audio/audio.provider";
import type { ConversationGateway, TurnInput } from "../gateways/conversation.gateway";
import { useBeginConversationWithTurns } from "../mutation/useBeginConversationWithTurns";
import { useIssueLiveToken } from "../mutation/useIssueLiveToken";
import { useRecordTurns } from "../mutation/useRecordTurns";
import { useChatStore, type LiveStatus } from "../stores/chat.store";
import { liveSessionConnector } from "./live-session.provider";
import type { LiveSession } from "./live-session.port";

type TurnBuffer = { input: string; output: string };

export const useLiveSession = (gateway: ConversationGateway) => {
  const queryClient = useQueryClient();
  const {
    setLiveStatus,
    setListening,
    setSpeaking,
    setMicMuted,
    setUserCaption,
    setAssistantCaption,
    clearCaptions,
  } = useChatStore();

  const connector = liveSessionConnector();
  const mic = useMicStream();
  const sink = useAudioSink();

  const issueLiveToken = useIssueLiveToken(gateway);
  const recordTurns = useRecordTurns(gateway);
  const beginConversationWithTurns = useBeginConversationWithTurns(gateway);

  const session = useRef<LiveSession | null>(null);
  const sessionRequested = useRef(false);
  const starting = useRef(false);
  const turn = useRef<TurnBuffer>({ input: "", output: "" });

  const startVoice = async () => {
    if (!isLiveCapable() || session.current) return;
    sessionRequested.current = true;
    if (starting.current) return;
    starting.current = true;
    setMicMuted(false);
    setLiveStatus("connecting");
    try {
      const { token, model } = await issueLiveToken.mutateAsync(
        useChatStore.getState().activeInstruction,
      );
      if (!sessionRequested.current) return;
      const live = await connector.connect(
        {
          token,
          model,
          history: historyFromMessages(useChatStore.getState().messages),
        },
        {
          onAudioFrame: (pcm) => {
            setSpeaking(true);
            sink.enqueue(pcm);
          },
          onInputTranscript: (text) => {
            bargeIn();
            if (turn.current.input.length === 0) setAssistantCaption("");
            turn.current.input += text;
            setUserCaption(turn.current.input);
          },
          onOutputTranscript: (text) => {
            turn.current.output += text;
            setAssistantCaption(turn.current.output);
          },
          onTurnComplete: () => {
            setSpeaking(false);
            setUserCaption("");
            void persistTurn();
          },
          onInterrupted: bargeIn,
          onError: () => {
            void endSession("error", "A sessão de voz caiu. Toque na bolinha para tentar de novo.");
          },
          onClose: () => {
            void endSession("idle");
          },
        },
      );
      if (!sessionRequested.current) {
        await closeQuietly(live);
        return;
      }
      session.current = live;
      sink.start();
      await mic.start((frame) => {
        if (useChatStore.getState().isMicMuted) return;
        try {
          session.current?.sendAudioFrame(frame);
        } catch {
          void endSession("error", "A sessão de voz caiu. Toque na bolinha para tentar de novo.");
        }
      });
      if (!sessionRequested.current) {
        await teardown();
        return;
      }
      setListening(true);
      setLiveStatus("live");
    } catch {
      await endSession("error", "Não foi possível iniciar a sessão de voz.");
    } finally {
      starting.current = false;
    }
  };

  const stopVoice = async () => {
    await endSession("idle");
  };

  const toggleMicMute = () => setMicMuted(!useChatStore.getState().isMicMuted);

  const sendTextToVoice = async (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    if (!session.current) await startVoice();
    if (!session.current) return;
    turn.current.input += trimmed;
    session.current.sendText(trimmed);
  };

  const getAudioLevel = () => {
    if (useChatStore.getState().isSpeaking) return sink.getLevel();
    if (useChatStore.getState().isMicMuted) return 0;
    return mic.getLevel();
  };

  const persistTurn = async () => {
    const conversationId = useChatStore.getState().activeConversationId;
    const turns = turnsFromBuffer(turn.current);
    turn.current = { input: "", output: "" };
    if (turns.length === 0) return;
    try {
      if (conversationId) await recordTurns.mutateAsync({ conversationId, turns });
      else await beginConversationWithTurns.mutateAsync(turns);
    } catch {
      const activeId = useChatStore.getState().activeConversationId;
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (activeId) queryClient.invalidateQueries({ queryKey: ["conversation", activeId] });
    }
  };

  const bargeIn = () => {
    if (useChatStore.getState().isSpeaking) {
      sink.stop();
      sink.start();
      setSpeaking(false);
    }
  };

  const endSession = async (status: LiveStatus, message?: string) => {
    sessionRequested.current = false;
    await teardown();
    setLiveStatus(status);
    if (message) notify.danger(message);
  };

  const teardown = async () => {
    const active = session.current;
    session.current = null;
    await mic.stop();
    sink.stop();
    setListening(false);
    setSpeaking(false);
    setMicMuted(false);
    clearCaptions();
    await closeQuietly(active);
  };

  return { startVoice, stopVoice, sendTextToVoice, toggleMicMute, getAudioLevel };
};

const closeQuietly = async (session: LiveSession | null): Promise<void> => {
  if (!session) return;
  try {
    await session.close();
  } catch {
    return;
  }
};

const isLiveCapable = (): boolean => {
  const { models, selectedModelId } = useChatStore.getState();
  const model = models.find((candidate) => candidate.id === selectedModelId) ?? null;
  return model?.isLive() ?? false;
};

const historyFromMessages = (
  messages: { role: "user" | "assistant"; content: string }[],
) =>
  messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({ role: message.role, content: message.content }));

const turnsFromBuffer = (buffer: TurnBuffer): TurnInput[] => {
  const turns: TurnInput[] = [];
  if (buffer.input.trim().length > 0) {
    turns.push({ role: "user", type: "voice", content: buffer.input.trim() });
  }
  if (buffer.output.trim().length > 0) {
    turns.push({ role: "assistant", type: "voice", content: buffer.output.trim() });
  }
  return turns;
};
