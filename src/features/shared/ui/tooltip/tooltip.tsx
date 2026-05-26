"use client";

import type { ReactNode } from "react";

import { TooltipRoot } from "./tooltip-root";
import { TooltipTrigger } from "./tooltip-trigger";
import { TooltipContent } from "./tooltip-content";
import type { TooltipPlacement } from "./tooltip.types";

export type TooltipProps = {
  label?: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
  children: ReactNode;
};

export const Tooltip = ({ label, placement = "top", className, children }: TooltipProps) => {
  if (!label) return <>{children}</>;

  return (
    <TooltipRoot placement={placement} className={className}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </TooltipRoot>
  );
};
