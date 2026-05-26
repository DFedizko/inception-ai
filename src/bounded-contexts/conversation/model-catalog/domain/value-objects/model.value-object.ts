import { Capability, type CapabilityValue } from "./capability.value-object";
import type { Tier } from "./tier.value-object";

type ModelProps = {
  id: string;
  label: string;
  capabilities: Capability[];
  tier: Tier;
};

export class Model {
  private readonly capabilities: Capability[];

  private constructor(
    readonly id: string,
    readonly label: string,
    capabilities: Capability[],
    readonly tier: Tier,
  ) {
    this.capabilities = [...capabilities].sort((first, second) => first.rank - second.rank);
  }

  static of(props: ModelProps): Model {
    return new Model(props.id, props.label, props.capabilities, props.tier);
  }

  isUsable(): boolean {
    return this.capabilities.length > 0;
  }

  supports(capability: Capability): boolean {
    return this.capabilities.some((owned) => owned.equals(capability));
  }

  capabilityValues(): CapabilityValue[] {
    return this.capabilities.map((capability) => capability.toString());
  }

  primaryRank(): number {
    return this.capabilities[0]?.rank ?? Number.MAX_SAFE_INTEGER;
  }
}
