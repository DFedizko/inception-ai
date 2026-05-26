import { Capability } from "../value-objects/capability.value-object";

export type ProviderModelFacts = {
  id: string;
  label: string;
  supportedActions: string[];
};

const textActions = ["generateContent", "generateContentStream"];
const liveActions = ["bidiGenerateContent"];

const nameOf = (facts: ProviderModelFacts): string => `${facts.id} ${facts.label}`.toLowerCase();

const speaksAudio = (facts: ProviderModelFacts): boolean => nameOf(facts).includes("tts");

const generatesText = (facts: ProviderModelFacts): boolean =>
  facts.supportedActions.some((action) => textActions.includes(action));

const streamsLiveAudio = (facts: ProviderModelFacts): boolean =>
  facts.supportedActions.some((action) => liveActions.includes(action));

const generatesImages = (facts: ProviderModelFacts): boolean => nameOf(facts).includes("image");

const generatesVideo = (facts: ProviderModelFacts): boolean => nameOf(facts).includes("veo");

export const deriveCapabilitiesFromProviderModel = (
  facts: ProviderModelFacts,
): Capability[] => {
  const capabilities: Capability[] = [];

  if (speaksAudio(facts)) {
    capabilities.push(Capability.speech);
  } else if (generatesText(facts)) {
    capabilities.push(Capability.text);
  }

  if (streamsLiveAudio(facts)) {
    capabilities.push(Capability.live);
  }

  if (generatesImages(facts)) {
    capabilities.push(Capability.image);
  }

  if (generatesVideo(facts)) {
    capabilities.push(Capability.video);
  }

  return capabilities;
};
