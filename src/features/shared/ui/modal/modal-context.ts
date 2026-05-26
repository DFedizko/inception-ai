"use client";

import { createContext, useContext } from "react";

export type ModalContextValue = {
  close: () => void;
  titleId: string;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalContextProvider = ModalContext.Provider;

export const useModalContext = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (context === null) {
    throw new Error("Modal pieces must be rendered inside <Modal>.");
  }
  return context;
};
