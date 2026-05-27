"use client";

import type { ReactNode } from "react";

type ModalFooterProps = {
  children: ReactNode;
};

export const ModalFooter = ({ children }: ModalFooterProps) => (
  <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-4">
    {children}
  </footer>
);
