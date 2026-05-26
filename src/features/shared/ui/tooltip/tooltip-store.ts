import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";

import type { TooltipPlacement } from "./tooltip.types";

export type TooltipStoreState = {
  isOpen: boolean;
  placement: TooltipPlacement;
  open: () => void;
  close: () => void;
};

export const createTooltipStore = (placement: TooltipPlacement): StoreApi<TooltipStoreState> =>
  createStore<TooltipStoreState>((set) => ({
    isOpen: false,
    placement,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
  }));

const TooltipStoreContext = createContext<StoreApi<TooltipStoreState> | null>(null);

export const TooltipStoreProvider = TooltipStoreContext.Provider;

export const useTooltipStore = (): TooltipStoreState => {
  const store = useContext(TooltipStoreContext);
  if (!store) throw new Error("Tooltip pieces must be rendered within <TooltipRoot>.");
  return useStore(store);
};
