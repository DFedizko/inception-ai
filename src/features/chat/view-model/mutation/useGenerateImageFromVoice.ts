import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { RecordedAudio } from "../audio/voice-recorder.ports";
import type { ConversationGateway } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

type GenerateImageFromVoiceInput = { conversationId: string | null; audio: RecordedAudio };

export const useGenerateImageFromVoice = (gateway: ConversationGateway) => {
  const queryClient = useQueryClient();
  const { setActiveConversationId, setMessages } = useChatStore();

  return useMutation({
    mutationFn: ({ conversationId, audio }: GenerateImageFromVoiceInput) =>
      gateway.generateImageFromVoice(conversationId, audio),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id.value);
      setMessages(conversation.messages);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversation.id.value] });
    },
    onError: () => notify.danger("Não foi possível gerar a imagem por voz."),
  });
};
