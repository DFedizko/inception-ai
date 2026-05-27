import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { ModelCatalogGateway } from "../gateways/model-catalog.gateway";
import { useChatStore } from "../stores/chat.store";

export const useListModels = (gateway: ModelCatalogGateway) => {
  const { setModels, setLoadingModels } = useChatStore();

  const { data, isPending, error } = useQuery({
    queryKey: ["models"],
    queryFn: () => gateway.listModels(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setLoadingModels(isPending);
  }, [isPending, setLoadingModels]);

  useEffect(() => {
    if (data) setModels(data);
  }, [data, setModels]);

  useEffect(() => {
    if (error) {
      setModels([]);
      notify.danger("Não foi possível carregar os modelos de IA.");
    }
  }, [error, setModels]);

  return { models: data ?? [], isPending, error };
};
