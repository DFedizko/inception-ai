import { useVoiceRecorder as useSharedVoiceRecorder } from "@/features/shared/hooks/useVoiceRecorder";

import type { UseVoiceRecorder } from "./voice-recorder.ports";

let useRecorder: UseVoiceRecorder = useSharedVoiceRecorder;

export const useVoiceRecorder: UseVoiceRecorder = () => useRecorder();

export const setVoiceRecorder = (recorder: UseVoiceRecorder): void => {
  useRecorder = recorder;
};
