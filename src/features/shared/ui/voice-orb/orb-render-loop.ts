import type { RefObject } from "react";

import type { OrbProps } from "./voice-orb.types";
import {
  FALLING_LEVEL_LERP,
  MAX_DELTA_SECONDS,
  RISING_LEVEL_LERP,
  ROTATION_DRIFT_PER_SECOND,
} from "./voice-orb.constants";
import { ColorMixer } from "./color-mixer";
import { HarmonicField } from "./harmonic-field";
import { OrbPainter } from "./orb-painter";

type LoopState = {
  rotationRadians: number;
  smoothedLevel: number;
  lastTimestamp: number;
};

export class OrbRenderLoop {
  private readonly painter: OrbPainter;
  private readonly harmonicField: HarmonicField;
  private readonly loopState: LoopState;
  private rafHandle = 0;
  private observer: ResizeObserver | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
    private readonly livePropsRef: RefObject<OrbProps>,
  ) {
    this.painter = new OrbPainter(canvas, context);
    this.harmonicField = new HarmonicField();
    this.loopState = {
      rotationRadians: 0,
      smoothedLevel: 0,
      lastTimestamp: performance.now(),
    };
  }

  public start(): void {
    this.painter.resize();
    this.observer = new ResizeObserver(() => this.painter.resize());
    this.observer.observe(this.canvas);
    this.rafHandle = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  public stop(): void {
    cancelAnimationFrame(this.rafHandle);
    this.observer?.disconnect();
    this.observer = null;
  }

  private tick(timestamp: number): void {
    const deltaSeconds = Math.min(
      MAX_DELTA_SECONDS,
      (timestamp - this.loopState.lastTimestamp) / 1000,
    );
    this.loopState.lastTimestamp = timestamp;
    const props = this.livePropsRef.current;
    if (!props) {
      this.scheduleNextFrame();
      return;
    }
    this.advanceMotion(props, deltaSeconds);
    this.painter.paint(
      props,
      this.harmonicField,
      this.loopState.rotationRadians,
      this.loopState.smoothedLevel,
      timestamp,
    );
    this.scheduleNextFrame();
  }

  private advanceMotion(props: OrbProps, deltaSeconds: number): void {
    const rawLevel = props.getAudioLevel ? props.getAudioLevel() : 0;
    const lerpFactor =
      rawLevel > this.loopState.smoothedLevel ? RISING_LEVEL_LERP : FALLING_LEVEL_LERP;
    this.loopState.smoothedLevel = ColorMixer.lerp(
      this.loopState.smoothedLevel,
      rawLevel,
      lerpFactor,
    );
    this.harmonicField.drift(deltaSeconds, props.speed);
    this.loopState.rotationRadians += ROTATION_DRIFT_PER_SECOND * deltaSeconds * props.speed;
  }

  private scheduleNextFrame(): void {
    this.rafHandle = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }
}
