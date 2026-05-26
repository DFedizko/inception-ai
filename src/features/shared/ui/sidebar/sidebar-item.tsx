import type { ReactNode } from "react";

type SidebarItemProps = {
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export const SidebarItem = ({ icon, active = false, onClick, children }: SidebarItemProps) => (
  <button type="button" onClick={onClick} aria-current={active} className={itemClass(active)}>
    {icon}
    <span className="truncate">{children}</span>
  </button>
);

const itemClass = (active: boolean) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
    active ? "bg-raised text-ink" : "text-ink-muted hover:bg-raised/60 hover:text-ink"
  }`;
