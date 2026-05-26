"use client";

import { useEffect, useState } from "react";

const TOKEN_NAMES = ["--voice-orb-stop-1", "--voice-orb-stop-2", "--voice-orb-stop-3"] as const;

const FALLBACK_PALETTE = ["#5BE7FF", "#3D7BFF", "#A06BFF"];

export const useVoiceOrbPalette = (): string[] => {
  const [palette, setPalette] = useState<string[]>(FALLBACK_PALETTE);

  useEffect(() => {
    const readPalette = () => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      const stops = TOKEN_NAMES.map((name) => computed.getPropertyValue(name).trim()).filter(
        (value) => value.length > 0,
      );
      if (stops.length === 3) setPalette(stops);
    };
    readPalette();
    const observer = new MutationObserver(readPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return palette;
};
