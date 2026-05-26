export class ColorMixer {
  public static lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  public static hexToRgba(hex: string, alpha: number): string {
    const cleaned = hex.replace("#", "");
    const red = parseInt(cleaned.slice(0, 2), 16);
    const green = parseInt(cleaned.slice(2, 4), 16);
    const blue = parseInt(cleaned.slice(4, 6), 16);
    return `rgba(${red},${green},${blue},${alpha})`;
  }

  public static mix(fromHex: string, toHex: string, ratio: number, alpha: number): string {
    const fromCleaned = fromHex.replace("#", "");
    const toCleaned = toHex.replace("#", "");
    const red = ColorMixer.mixChannel(fromCleaned, toCleaned, 0, ratio);
    const green = ColorMixer.mixChannel(fromCleaned, toCleaned, 2, ratio);
    const blue = ColorMixer.mixChannel(fromCleaned, toCleaned, 4, ratio);
    return `rgba(${red},${green},${blue},${alpha})`;
  }

  public static pickStrokeColor(palette: string[], stackPosition: number, alpha: number): string {
    if (palette.length >= 3 && stackPosition < 0.5) {
      return ColorMixer.mix(palette[0], palette[1], stackPosition * 2, alpha);
    }
    if (palette.length >= 3) {
      return ColorMixer.mix(palette[1], palette[2], (stackPosition - 0.5) * 2, alpha);
    }
    return ColorMixer.mix(palette[0], palette[1] ?? palette[0], stackPosition, alpha);
  }

  private static mixChannel(
    fromCleaned: string,
    toCleaned: string,
    offset: number,
    ratio: number,
  ): number {
    const fromChannel = parseInt(fromCleaned.slice(offset, offset + 2), 16);
    const toChannel = parseInt(toCleaned.slice(offset, offset + 2), 16);
    return Math.round(ColorMixer.lerp(fromChannel, toChannel, ratio));
  }
}
