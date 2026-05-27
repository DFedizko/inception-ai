"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { useModalContext } from "./modal-context";

type ModalTitleProps = {
  children: ReactNode;
  showClose?: boolean;
};

export const ModalTitle = ({ children, showClose = true }: ModalTitleProps) => {
  const { close, titleId } = useModalContext();

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
      <h2 id={titleId} className="text-base font-semibold text-ink">
        {children}
      </h2>
      {showClose && (
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-raised hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </header>
  );
};
