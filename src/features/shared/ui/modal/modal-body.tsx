"use client";

import type { ReactNode } from "react";

type ModalBodyProps = {
  children: ReactNode;
};

export const ModalBody = ({ children }: ModalBodyProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
);
