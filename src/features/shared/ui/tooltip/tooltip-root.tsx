"use client";

import { useRef, type ReactNode } from "react";

import { createTooltipStore, TooltipStoreProvider } from "./tooltip-store";
import type { TooltipPlacement } from "./tooltip.types";

type TooltipRootProps = {
  placement?: TooltipPlacement;
  className?: string;
  children: ReactNode;
};

export const TooltipRoot = ({ placement = "top", className, children }: TooltipRootProps) => {
  const storeRef = useRef(createTooltipStore(placement));

  return (
    <TooltipStoreProvider value={storeRef.current}>
      <span className={`relative inline-flex ${className ?? ""}`}>{children}</span>
    </TooltipStoreProvider>
  );
};
