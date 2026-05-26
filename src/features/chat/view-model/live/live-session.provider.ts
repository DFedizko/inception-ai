import { GenAiLiveConnector } from "./genai-live.connector";
import type { LiveSessionConnector } from "./live-session.port";

let connector: LiveSessionConnector = new GenAiLiveConnector();

export const liveSessionConnector = (): LiveSessionConnector => connector;

export const setLiveSessionConnector = (next: LiveSessionConnector): void => {
  connector = next;
};
