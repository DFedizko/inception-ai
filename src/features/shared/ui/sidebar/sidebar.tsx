import type { ReactNode } from "react";

type SidebarProps = {
  children: ReactNode;
  className?: string;
};

export const Sidebar = ({ children, className }: SidebarProps) => (
  <aside className={`flex h-dvh w-60 shrink-0 flex-col bg-panel ${className ?? ""}`}>
    {children}
  </aside>
);
