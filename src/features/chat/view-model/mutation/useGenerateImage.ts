import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { ConversationGateway } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

type GenerateImageInput = { conversationId: string | null; prompt: string };

export const useGenerateImage = (gateway: ConversationGateway) => {
  const queryClient = useQueryClient();
  const { setActiveConversationId, setMessages } = useChatStore();

  return useMutation({
    mutationFn: ({ conversationId, prompt }: GenerateImageInput) =>
      gateway.generateImage(conversationId, prompt),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id.value);
      setMessages(conversation.messages);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversation.id.value] });
    },
    onError: () => notify.danger("Não foi possível gerar a imagem."),
  });
};
