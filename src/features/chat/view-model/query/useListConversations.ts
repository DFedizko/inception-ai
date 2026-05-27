import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { ConversationGateway } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

export const useListConversations = (gateway: ConversationGateway) => {
  const { setConversations, setLoadingConversations } = useChatStore();

  const { data, isPending, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => gateway.listConversations(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setLoadingConversations(isPending);
  }, [isPending, setLoadingConversations]);

  useEffect(() => {
    if (data) setConversations(data);
  }, [data, setConversations]);

  useEffect(() => {
    if (error) notify.danger("Não foi possível carregar as conversas.");
  }, [error]);

  return { conversations: data ?? [], isPending, error };
};
