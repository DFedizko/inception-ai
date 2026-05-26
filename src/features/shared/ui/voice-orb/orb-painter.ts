import type { OrbProps, VoiceOrbState } from "./voice-orb.types";
import { MAX_HARMONIC_COUNT, RADIAL_SAMPLE_COUNT } from "./voice-orb.constants";
import { ColorMixer } from "./color-mixer";
import type { HarmonicField } from "./harmonic-field";

type Point = { x: number; y: number };

type StateModulation = {
  amplitudeMultiplier: number;
  radiusMultiplier: number;
};

type LineDrawContext = {
  rotationRadians: number;
  smoothedLevel: number;
  modulation: StateModulation;
  baseRadius: number;
  center: Point;
  props: OrbProps;
  harmonicField: HarmonicField;
};

export class OrbPainter {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
  ) {}

  public resize(): void {
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * devicePixelRatio);
    this.canvas.height = Math.round(rect.height * devicePixelRatio);
    this.context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  public paint(
    props: OrbProps,
    harmonicField: HarmonicField,
    rotationRadians: number,
    smoothedLevel: number,
    timestamp: number,
  ): void {
    const rect = this.canvas.getBoundingClientRect();
    const idleBreath = 0.5 + 0.5 * Math.sin(timestamp * 0.0009);
    const modulation = OrbPainter.resolveStateModulation(props.state, smoothedLevel, idleBreath);
    const baseRadius =
      Math.min(rect.width, rect.height) * 0.5 * props.baseRadiusPct * modulation.radiusMultiplier;
    const center: Point = { x: rect.width / 2, y: rect.height / 2 };

    this.context.clearRect(0, 0, rect.width, rect.height);
    this.context.globalCompositeOperation = "lighter";

    this.paintLines({
      rotationRadians,
      smoothedLevel,
      modulation,
      baseRadius,
      center,
      props,
      harmonicField,
    });
    this.context.globalCompositeOperation = "source-over";
  }

  private paintLines(line: LineDrawContext): void {
    for (let lineIndex = 0; lineIndex < line.props.lineCount; lineIndex++) {
      this.paintLine(line, lineIndex);
    }
  }

  private paintLine(line: LineDrawContext, lineIndex: number): void {
    const stackPosition = lineIndex / (line.props.lineCount - 1);
    const lineRotation = line.rotationRadians + stackPosition * Math.PI * 0.42;
    const linePhaseShift = stackPosition * Math.PI * 0.9;
    this.applyLineStyle(line, stackPosition);
    this.tracePolarCurve(line, lineRotation, linePhaseShift);
    this.context.closePath();
    this.context.stroke();
  }

  private applyLineStyle(line: LineDrawContext, stackPosition: number): void {
    const edgeFade = 1 - Math.pow(Math.abs(stackPosition - 0.5) * 2, 1.6) * 0.45;
    const alpha =
      (0.18 + 0.42 * edgeFade) * (0.7 + (0.3 * line.modulation.amplitudeMultiplier) / 1.2);
    const stroke = ColorMixer.pickStrokeColor(line.props.palette, stackPosition, alpha);
    this.context.strokeStyle = stroke;
    this.context.lineWidth = 0.9 + line.smoothedLevel * 1.0;
    this.context.shadowColor = stroke;
    this.context.shadowBlur =
      line.props.glow > 0 ? 3 + line.props.glow * 6 + line.smoothedLevel * 10 : 0;
  }

  private tracePolarCurve(
    line: LineDrawContext,
    lineRotation: number,
    linePhaseShift: number,
  ): void {
    this.context.beginPath();
    for (let sample = 0; sample <= RADIAL_SAMPLE_COUNT; sample++) {
      this.plotSample(line, sample, lineRotation, linePhaseShift);
    }
  }

  private plotSample(
    line: LineDrawContext,
    sampleIndex: number,
    lineRotation: number,
    linePhaseShift: number,
  ): void {
    const theta = (sampleIndex / RADIAL_SAMPLE_COUNT) * Math.PI * 2 + lineRotation;
    const complexity = Math.min(line.props.complexity, MAX_HARMONIC_COUNT);
    const radius =
      line.baseRadius *
      line.harmonicField.sumContribution(
        complexity,
        theta,
        linePhaseShift,
        line.modulation.amplitudeMultiplier,
      );
    const x = line.center.x + Math.cos(theta) * radius;
    const y = line.center.y + Math.sin(theta) * radius;
    if (sampleIndex === 0) this.context.moveTo(x, y);
    if (sampleIndex !== 0) this.context.lineTo(x, y);
  }

  private static resolveStateModulation(
    state: VoiceOrbState,
    smoothedLevel: number,
    idleBreath: number,
  ): StateModulation {
    if (state === "speaking") {
      return {
        amplitudeMultiplier: 1.3 + smoothedLevel * 2.8 + 0.1 * idleBreath,
        radiusMultiplier: 1.05 + smoothedLevel * 0.22,
      };
    }
    if (state === "listening") {
      return {
        amplitudeMultiplier: 0.75 + smoothedLevel * 2.4 + 0.15 * idleBreath,
        radiusMultiplier: 0.98 + smoothedLevel * 0.16 + 0.02 * idleBreath,
      };
    }
    return {
      amplitudeMultiplier: 0.42 + 0.16 * idleBreath,
      radiusMultiplier: 1.0 + 0.015 * idleBreath,
    };
  }
}
