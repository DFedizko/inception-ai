import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { AssistantReplyChunk, ConversationGateway } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

export const useSendMessage = (gateway: ConversationGateway) => {
  const queryClient = useQueryClient();
  const {
    addUserMessage,
    startAssistantReply,
    appendReplyChunk,
    appendThoughtChunk,
    setActiveConversationId,
  } = useChatStore();

  return useMutation({
    mutationFn: async (content: string) => {
      addUserMessage(content);
      startAssistantReply();
      const handleReply = (chunk: AssistantReplyChunk) => {
        if (chunk.kind === "thought") return appendThoughtChunk(chunk.text);
        appendReplyChunk(chunk.text);
      };
      const conversationId = useChatStore.getState().activeConversationId;
      if (conversationId) {
        await gateway.streamAssistantReply(conversationId, content, handleReply);
        return;
      }
      await gateway.beginConversation(content, (id) => setActiveConversationId(id), handleReply);
    },
    onSuccess: () => {
      const settledId = useChatStore.getState().activeConversationId;
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (settledId) {
        queryClient.invalidateQueries({ queryKey: ["conversation", settledId] });
      }
    },
    onError: () => notify.danger("Não foi possível obter a resposta da IA. Tente novamente."),
  });
};
