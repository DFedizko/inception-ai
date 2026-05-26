"use client";

import type { ReactNode } from "react";

import { useTooltipStore } from "./tooltip-store";

type TooltipTriggerProps = {
  children: ReactNode;
  className?: string;
};

export const TooltipTrigger = ({ children, className }: TooltipTriggerProps) => {
  const { open, close } = useTooltipStore();

  return (
    <span
      className={`inline-flex ${className ?? ""}`}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocusCapture={open}
      onBlurCapture={close}
    >
      {children}
    </span>
  );
};
