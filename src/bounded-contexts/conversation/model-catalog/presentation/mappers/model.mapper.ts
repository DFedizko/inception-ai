import type { Model } from "../../domain/value-objects/model.value-object";
import type { ModelInfo } from "../dto/model-info.dto";

export const toModelInfoDTO = (model: Model): ModelInfo => ({
  id: model.id,
  label: model.label,
  capabilities: model.capabilityValues(),
  tier: model.tier,
});
