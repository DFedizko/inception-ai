"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type MiniPaginatorProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  alwaysShow?: boolean;
  className?: string;
};

export const MiniPaginator = ({ page, pageCount, onChange, alwaysShow = false, className = "" }: MiniPaginatorProps) => {
  if (pageCount <= 1 && !alwaysShow) return null;

  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <div className={`flex items-center justify-center gap-2 text-xs text-ink-muted ${className}`}>
      <button
        type="button"
        aria-label="Página anterior"
        disabled={atStart}
        onClick={() => onChange(page - 1)}
        className="grid size-6 place-items-center rounded-md text-ink transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:text-ink-muted/40 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={14} aria-hidden />
      </button>
      <span aria-live="polite" className="tabular-nums">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        aria-label="Próxima página"
        disabled={atEnd}
        onClick={() => onChange(page + 1)}
        className="grid size-6 place-items-center rounded-md text-ink transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:text-ink-muted/40 disabled:hover:bg-transparent"
      >
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  );
};
