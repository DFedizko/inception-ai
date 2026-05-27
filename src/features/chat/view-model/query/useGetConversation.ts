import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { ConversationGateway } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

export const useGetConversation = (
  gateway: ConversationGateway,
  conversationId: string | null,
) => {
  const { setLoadingMessages } = useChatStore();
  const enabled = conversationId != null && conversationId.length > 0;

  const { data, isPending, error } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => gateway.getConversation(conversationId as string),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const loading = enabled && isPending;

  useEffect(() => {
    setLoadingMessages(loading);
  }, [loading, setLoadingMessages]);

  useEffect(() => {
    if (error) notify.danger("Não foi possível abrir esta conversa.");
  }, [error]);

  return { conversation: data ?? null, isPending: loading, error };
};
