"use client";

import { ChevronDown } from "lucide-react";
import { isSelected, useSelectStore } from "./select-store";

export const SelectTrigger = () => {
  const { options, selectedValues, isOpen, disabled, placeholder, label, toggle } = useSelectStore();

  const chosen = options.filter((option) => isSelected(selectedValues, option.value));
  const summary = chosen.length === 0 ? placeholder ?? "Select…" : chosen.map((option) => option.label).join(", ");

  return (
    <button
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label={label}
      disabled={disabled}
      onClick={toggle}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-left text-sm text-ink transition-colors hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className={chosen.length === 0 ? "truncate text-ink-muted" : "truncate"}>{summary}</span>
        {chosen.length === 1 && chosen[0].trailing ? (
          <span className="shrink-0">{chosen[0].trailing}</span>
        ) : null}
      </span>
      <ChevronDown
        size={16}
        aria-hidden
        className={`shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
};
