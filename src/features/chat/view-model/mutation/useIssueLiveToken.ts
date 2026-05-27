import { useMutation } from "@tanstack/react-query";

import type { ConversationGateway } from "../gateways/conversation.gateway";

export const useIssueLiveToken = (gateway: ConversationGateway) =>
  useMutation({
    mutationFn: (instruction?: string | null) => gateway.issueLiveToken(instruction),
  });
