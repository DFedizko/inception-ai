"use client";

import { Search } from "lucide-react";
import { useSelectStore } from "./select-store";

export const SelectSearch = () => {
  const { query, setQuery } = useSelectStore();

  return (
    <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
      <Search size={14} aria-hidden className="shrink-0 text-ink-muted" />
      <input
        type="text"
        role="searchbox"
        autoFocus
        value={query}
        placeholder="Search…"
        onChange={(event) => setQuery(event.target.value)}
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
    </div>
  );
};
