"use client";

import { Mic, Type } from "lucide-react";

export type ModelFilter = "text" | "voice";

type ModelFilterTabsProps = {
  value: ModelFilter;
  onChange: (filter: ModelFilter) => void;
};

const tabs: { filter: ModelFilter; label: string; icon: typeof Type }[] = [
  { filter: "text", label: "Texto", icon: Type },
  { filter: "voice", label: "Voz", icon: Mic },
];

export const ModelFilterTabs = ({ value, onChange }: ModelFilterTabsProps) => (
  <div role="tablist" aria-label="Filtrar por modalidade" className="flex gap-1 rounded-md bg-raised p-1">
    {tabs.map(({ filter, label, icon: Icon }) => (
      <button
        key={filter}
        type="button"
        role="tab"
        aria-selected={value === filter}
        onClick={() => onChange(filter)}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
          value === filter ? "bg-accent/20 text-accent" : "text-ink-muted hover:text-ink"
        }`}
      >
        <Icon size={13} aria-hidden />
        {label}
      </button>
    ))}
  </div>
);
