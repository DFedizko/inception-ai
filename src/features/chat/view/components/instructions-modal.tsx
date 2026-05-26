"use client";

import { useEffect, useState } from "react";

import { Markdown, Modal, ModalFooter, ModalTitle } from "@/features/shared/ui";
import { useChatStore } from "../../view-model/stores/chat.store";
import { useChatViewModel } from "../../view-model/useChatViewModel";

type InstructionsModalProps = {
  open: boolean;
  onClose: () => void;
};

export const InstructionsModal = ({
  open,
  onClose,
}: InstructionsModalProps) => {
  const { activeInstruction } = useChatStore();
  const { instructAgent } = useChatViewModel();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setDraft(activeInstruction ?? "");
  }, [open]);

  const save = async () => {
    await instructAgent(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      animation="genie"
      size="xl"
      ariaLabel="Instruções do agente"
    >
      <ModalTitle>Instruções do agente</ModalTitle>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px overflow-hidden bg-line md:grid-cols-2">
        <div className="flex min-h-0 flex-col bg-panel">
          <span className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
            Markdown
          </span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              "# Quem é o agente\n\nEscreva o prompt em **markdown**: papel, tom, regras..."
            }
            className="min-h-72 flex-1 resize-none bg-panel px-4 py-3 font-mono text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <div className="flex min-h-0 flex-col bg-panel">
          <span className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
            Preview
          </span>
          <div className="min-h-72 flex-1 overflow-y-auto px-4 py-3">
            {draft.trim().length > 0 ? (
              <Markdown>{draft}</Markdown>
            ) : (
              <p className="text-sm text-ink-muted">
                O preview do markdown aparece aqui.
              </p>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={draft.trim().length === 0}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-ink transition disabled:opacity-40"
        >
          Salvar instrução
        </button>
      </ModalFooter>
    </Modal>
  );
};
