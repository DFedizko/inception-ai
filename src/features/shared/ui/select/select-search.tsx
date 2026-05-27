"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/features/shared/hooks/useDebounce";
import { useSelectStore } from "./select-store";

const searchDebounceMs = 300;

export const SelectSearch = () => {
  const { setQuery } = useSelectStore();
  const [text, setText] = useState("");
  const debounced = useDebounce(text, searchDebounceMs);

  useEffect(() => setQuery(debounced), [debounced, setQuery]);

  return (
    <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
      <Search size={14} aria-hidden className="shrink-0 text-ink-muted" />
      <input
        type="text"
        role="searchbox"
        autoFocus
        value={text}
        placeholder="Buscar…"
        onChange={(event) => setText(event.target.value)}
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
    </div>
  );
};
