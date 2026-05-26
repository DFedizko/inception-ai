import type { ReactNode } from "react";

type SidebarHeaderProps = {
  icon?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
};

export const SidebarHeader = ({ icon, title, action }: SidebarHeaderProps) => (
  <div className="flex items-center gap-2.5 px-4 py-4">
    {icon && (
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </span>
    )}
    <span className="truncate text-sm font-semibold text-ink">{title}</span>
    {action && <span className="ml-auto">{action}</span>}
  </div>
);
