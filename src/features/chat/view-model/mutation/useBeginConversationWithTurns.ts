import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ConversationGateway, TurnInput } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

export const useBeginConversationWithTurns = (gateway: ConversationGateway) => {
  const queryClient = useQueryClient();
  const { setActiveConversationId, setMessages } = useChatStore();

  return useMutation({
    mutationFn: (turns: TurnInput[]) => gateway.beginConversationWithTurns(turns),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id.value);
      setMessages(conversation.messages);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversation.id.value] });
    },
  });
};
