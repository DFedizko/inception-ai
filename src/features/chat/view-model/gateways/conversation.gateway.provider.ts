import { FetchHttpClient } from "@/features/shared/http/fetch.http-client";

import type { ConversationGateway } from "./conversation.gateway";
import { HttpConversationGateway } from "./conversation.http.gateway";

let gateway: ConversationGateway = new HttpConversationGateway(new FetchHttpClient());

export const conversationGateway = (): ConversationGateway => gateway;

export const setConversationGateway = (next: ConversationGateway): void => {
  gateway = next;
};
