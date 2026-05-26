import type { ReactNode } from "react";

export type BadgeTone = "accent" | "neutral" | "warn";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

const toneClass: Record<BadgeTone, string> = {
  accent: "bg-accent/15 text-accent",
  neutral: "bg-raised text-ink-muted",
  warn: "bg-warn/15 text-warn",
};

export const Badge = ({ tone = "neutral", children }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${toneClass[tone]}`}
  >
    {children}
  </span>
);
