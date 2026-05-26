"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { SelectOption } from "./select-option";
import { SelectSearch } from "./select-search";
import { useSelectStore, visibleOptions } from "./select-store";

const maxDropdownHeight = 288;

export const SelectList = () => {
  const state = useSelectStore();
  const { isOpen, loading, searchable, label } = state;
  const ref = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const trigger = ref.current?.parentElement?.firstElementChild ?? ref.current?.parentElement;
    const rect = trigger?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUp(spaceBelow < maxDropdownHeight && rect.top > spaceBelow);
  }, [isOpen]);

  if (!isOpen) return null;

  const options = visibleOptions(state);
  const position = openUp ? "bottom-full mb-1.5" : "top-full mt-1.5";

  return (
    <div
      ref={ref}
      className={`absolute z-50 ${position} w-full overflow-hidden rounded-lg border border-line bg-panel shadow-xl shadow-black/30`}
    >
      {searchable ? <SelectSearch /> : null}
      <ul role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
        {loading ? (
          <li className="flex items-center gap-2 px-2.5 py-3 text-sm text-ink-muted">
            <Loader2 size={14} aria-hidden className="animate-spin" />
            Loading…
          </li>
        ) : options.length === 0 ? (
          <li className="px-2.5 py-3 text-sm text-ink-muted">No options</li>
        ) : (
          options.map((option, index) => (
            <SelectOption key={String(option.value)} option={option} index={index} />
          ))
        )}
      </ul>
    </div>
  );
};
