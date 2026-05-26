"use client";

import { Check } from "lucide-react";
import { isSelected, useSelectStore } from "./select-store";
import type { SelectOption as SelectOptionModel } from "./select.types";

type SelectOptionProps<T> = {
  option: SelectOptionModel<T>;
  index: number;
};

export const SelectOption = <T,>({ option, index }: SelectOptionProps<T>) => {
  const { selectedValues, highlightedIndex, selectByIndex, setHighlightedIndex } = useSelectStore<T>();

  const selected = isSelected(selectedValues, option.value);
  const highlighted = highlightedIndex === index;

  return (
    <li
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled}
      onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
      onClick={() => selectByIndex(index)}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm ${
        option.disabled ? "cursor-not-allowed text-ink-muted/50" : "text-ink"
      } ${highlighted && !option.disabled ? "bg-accent/15" : ""}`}
    >
      {option.icon ? <span className="shrink-0 text-ink-muted">{option.icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{option.label}</span>
        {option.secondary ? <span className="block truncate text-xs text-ink-muted">{option.secondary}</span> : null}
      </span>
      {option.trailing ? <span className="shrink-0">{option.trailing}</span> : null}
      {selected ? <Check size={16} aria-hidden className="shrink-0 text-accent" /> : null}
    </li>
  );
};
