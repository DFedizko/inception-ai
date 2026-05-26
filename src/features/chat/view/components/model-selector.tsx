"use client";

import { Tooltip } from "@/features/shared/ui";
import type { AiModel, Capability, Tier } from "../../model/ai-model.model";
import { useChatStore } from "../../view-model/stores/chat.store";
import { useChatViewModel } from "../../view-model/useChatViewModel";
import { ModelSelectorSkeleton } from "./model-selector-skeleton";
import { Badge, Select } from "./select.seam";

export const ModelSelector = () => {
  const { models, isLoadingModels, selectedModelId, mode } = useChatStore();
  const { selectModel } = useChatViewModel();

  if (isLoadingModels && models.length === 0) return <ModelSelectorSkeleton />;

  const capable = models.filter(byCapability(mode === "voice" ? "live" : "text"));
  const noModelReason = capable.length === 0 ? reasonNoModel(mode) : undefined;

  return (
    <Tooltip label={noModelReason} placement="bottom" className="w-full">
      <Select
        label="Modelo"
        placeholder="Escolha um modelo"
        value={selectedModelId}
        disabled={capable.length === 0}
        onChange={selectModel}
        options={capable.map((model) => ({
          value: model.id,
          label: model.label,
          trailing: tierBadge(model.tier),
        }))}
      />
    </Tooltip>
  );
};

const reasonNoModel = (mode: "text" | "voice") =>
  mode === "voice"
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

const byCapability = (capability: Capability) => (model: AiModel) =>
  model.capabilities.includes(capability);
