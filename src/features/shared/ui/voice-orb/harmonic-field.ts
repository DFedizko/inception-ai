import { MAX_HARMONIC_COUNT } from "./voice-orb.constants";

type Harmonic = {
  angularFrequency: number;
  driftPerSecond: number;
  amplitudeWeight: number;
  phaseRadians: number;
};

export class HarmonicField {
  private readonly harmonics: Harmonic[];

  constructor(count: number = MAX_HARMONIC_COUNT) {
    this.harmonics = Array.from({ length: count }, (_, index) =>
      HarmonicField.buildHarmonic(index),
    );
  }

  public drift(deltaSeconds: number, speed: number): void {
    this.harmonics.forEach((harmonic) => this.driftSingle(harmonic, deltaSeconds, speed));
  }

  public sumContribution(
    complexity: number,
    theta: number,
    linePhaseShift: number,
    amplitudeMultiplier: number,
  ): number {
    const limit = Math.min(complexity, this.harmonics.length);
    let multiplier = 1;
    for (let harmonicIndex = 0; harmonicIndex < limit; harmonicIndex++) {
      multiplier += this.singleContribution(
        this.harmonics[harmonicIndex],
        harmonicIndex,
        theta,
        linePhaseShift,
        amplitudeMultiplier,
      );
    }
    return multiplier;
  }

  private driftSingle(harmonic: Harmonic, deltaSeconds: number, speed: number): void {
    harmonic.phaseRadians += harmonic.driftPerSecond * deltaSeconds * speed;
  }

  private singleContribution(
    harmonic: Harmonic,
    harmonicIndex: number,
    theta: number,
    linePhaseShift: number,
    amplitudeMultiplier: number,
  ): number {
    return (
      harmonic.amplitudeWeight *
      0.18 *
      amplitudeMultiplier *
      Math.sin(
        harmonic.angularFrequency * theta +
          harmonic.phaseRadians +
          linePhaseShift * (harmonicIndex + 1) * 0.3,
      )
    );
  }

  private static buildHarmonic(index: number): Harmonic {
    return {
      angularFrequency: 2 + index,
      driftPerSecond: 0.18 + index * 0.07,
      amplitudeWeight: 0.55 / (1 + index * 0.6),
      phaseRadians: Math.random() * Math.PI * 2,
    };
  }
}
