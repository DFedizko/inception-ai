import type { ReactNode } from "react";

type BaseLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export const BaseLayout = ({ sidebar, children }: BaseLayoutProps) => (
  <div className="flex h-dvh w-full bg-panel">
    {sidebar}
    <main className="min-w-0 flex-1 p-1.5">
      <div className="h-full overflow-y-auto rounded-lg border border-line bg-base">
        {children}
      </div>
    </main>
  </div>
);
