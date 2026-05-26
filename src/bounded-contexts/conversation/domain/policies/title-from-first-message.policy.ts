import { Title } from "../value-objects/title.value-object";

const maxTitleLength = 50;

export const deriveTitleFromFirstMessage = (firstMessageContent: string): Title => {
  const normalized = firstMessageContent.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxTitleLength) {
    return Title.of(normalized);
  }

  const hardCut = normalized.slice(0, maxTitleLength);
  const lastSpace = hardCut.lastIndexOf(" ");
  const wordBoundaryCut = lastSpace > 0 ? hardCut.slice(0, lastSpace) : hardCut;

  return Title.of(`${wordBoundaryCut.trimEnd()}…`);
};
