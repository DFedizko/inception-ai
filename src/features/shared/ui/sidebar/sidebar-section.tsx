import type { ReactNode } from "react";

type SidebarSectionProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

export const SidebarSection = ({ label, children, className }: SidebarSectionProps) => (
  <nav className={`flex flex-col gap-0.5 px-2 ${className ?? ""}`}>
    {label && (
      <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>
    )}
    {children}
  </nav>
);
