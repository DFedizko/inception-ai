export type VoiceOrbState = "idle" | "listening" | "speaking";

export type OrbProps = {
  state: VoiceOrbState;
  lineCount: number;
  baseRadiusPct: number;
  complexity: number;
  speed: number;
  palette: string[];
  glow: number;
  getAudioLevel: () => number;
};
