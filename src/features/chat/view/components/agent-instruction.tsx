"use client";

import { useState } from "react";
import { Bot } from "lucide-react";

import { useChatStore } from "../../view-model/stores/chat.store";
import { InstructionsModal } from "./instructions-modal";

export const AgentInstruction = () => {
  const { activeInstruction } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Instruir agente"
        className={chip(activeInstruction !== null)}
      >
        <Bot className="size-3.5" />
        {activeInstruction ? "Agente instruído" : "Instruir agente"}
      </button>

      <InstructionsModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

const chip = (isSet: boolean) =>
  `flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
    isSet
      ? "border-accent/40 bg-accent/15 text-accent"
      : "border-line bg-panel text-ink-muted hover:text-ink"
  }`;
