"use client";

import { useState } from "react";
import { Tooltip } from "@/features/shared/ui";
import type { AiModel, Tier } from "../../model/ai-model.model";
import { useChatStore } from "../../view-model/stores/chat.store";
import { useChatViewModel } from "../../view-model/useChatViewModel";
import { ModelFilterTabs, type ModelFilter } from "./model-filter-tabs";
import { ModelSelectorSkeleton } from "./model-selector-skeleton";
import { Badge, Select } from "./select.seam";

const modelsPerPage = 6;

export const ModelSelector = () => {
  const { models, isLoadingModels, selectedModelId, mode } = useChatStore();
  const { selectModel } = useChatViewModel();
  const [filter, setFilter] = useState<ModelFilter>(mode);

  if (isLoadingModels && models.length === 0) return <ModelSelectorSkeleton />;

  const matching = models.filter(byFilter(filter));
  const noModelReason = matching.length === 0 ? reasonNoModel(filter) : undefined;

  return (
    <Tooltip label={noModelReason} placement="bottom" className="w-full">
      <Select
        label="Modelo"
        placeholder="Escolha um modelo"
        value={selectedModelId}
        searchable
        pageSize={modelsPerPage}
        toolbar={<ModelFilterTabs value={filter} onChange={setFilter} />}
        onChange={selectModel}
        options={matching.map((model) => ({
          value: model.id,
          label: model.label,
          trailing: tierBadge(model.tier),
        }))}
      />
    </Tooltip>
  );
};

const byFilter = (filter: ModelFilter) => (model: AiModel) =>
  filter === "voice" ? model.isLive() : model.supports("text");

const reasonNoModel = (filter: ModelFilter) =>
  filter === "voice"
    ? "Nenhum modelo de voz disponível no momento"
    : "Nenhum modelo de texto disponível no momento";

const tierBadge = (tier: Tier) => {
  if (tier === "unknown") {
    return (
      <Tooltip label="Não sabemos se este modelo é gratuito ou pago" placement="left">
        <Badge tone="warn">?</Badge>
      </Tooltip>
    );
  }
  return <Badge tone={tier === "free" ? "accent" : "neutral"}>{tier}</Badge>;
};
