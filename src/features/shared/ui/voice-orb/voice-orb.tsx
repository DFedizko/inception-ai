"use client";

import { useEffect, useRef } from "react";

import { useVoiceOrbPalette } from "@/features/shared/hooks/useVoiceOrbPalette";
import { OrbRenderLoop } from "./orb-render-loop";
import type { OrbProps, VoiceOrbState } from "./voice-orb.types";

export type { VoiceOrbState } from "./voice-orb.types";

type VoiceOrbProps = {
  getAudioLevel: () => number;
  state?: VoiceOrbState;
  lineCount?: number;
  baseRadiusPct?: number;
  complexity?: number;
  speed?: number;
  palette?: string[];
  glow?: number;
};

export const VoiceOrb = ({
  getAudioLevel,
  state = "idle",
  lineCount = 36,
  baseRadiusPct = 0.42,
  complexity = 4,
  speed = 1,
  palette,
  glow = 0.7,
}: VoiceOrbProps) => {
  const themePalette = useVoiceOrbPalette();
  const resolvedPalette = palette ?? themePalette;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveProps = useRef<OrbProps>({
    state,
    lineCount,
    baseRadiusPct,
    complexity,
    speed,
    palette: resolvedPalette,
    glow,
    getAudioLevel,
  });

  useEffect(() => {
    liveProps.current = {
      state,
      lineCount,
      baseRadiusPct,
      complexity,
      speed,
      palette: resolvedPalette,
      glow,
      getAudioLevel,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    const loop = new OrbRenderLoop(canvas, context, liveProps);
    loop.start();
    return () => loop.stop();
  }, []);

  return <canvas ref={canvasRef} className="block size-full" />;
};
