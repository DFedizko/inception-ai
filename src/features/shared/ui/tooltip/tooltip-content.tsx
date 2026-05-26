"use client";

import type { ReactNode } from "react";

import { useTooltipStore } from "./tooltip-store";
import type { TooltipPlacement } from "./tooltip.types";

type TooltipContentProps = {
  children: ReactNode;
};

export const TooltipContent = ({ children }: TooltipContentProps) => {
  const { isOpen, placement } = useTooltipStore();

  if (!isOpen) return null;

  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-50 w-max max-w-56 rounded-md border border-line bg-raised px-2 py-1 text-xs text-ink shadow-lg ${placementClass[placement]}`}
    >
      {children}
    </span>
  );
};

const placementClass: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};
