import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notify } from "@/features/shared/ui/notification";
import type { ConversationGateway } from "../gateways/conversation.gateway";
import { useChatStore } from "../stores/chat.store";

type InstructAgentInput = { conversationId: string; instruction: string };

export const useInstructAgent = (gateway: ConversationGateway) => {
  const queryClient = useQueryClient();
  const { setActiveInstruction } = useChatStore();

  return useMutation({
    mutationFn: ({ conversationId, instruction }: InstructAgentInput) =>
      gateway.instructAgent(conversationId, instruction),
    onSuccess: (conversation) => {
      setActiveInstruction(conversation.instruction);
      queryClient.invalidateQueries({ queryKey: ["conversation", conversation.id.value] });
      notify.success("Instrução do agente salva.");
    },
    onError: () => notify.danger("Não foi possível salvar a instrução do agente."),
  });
};
