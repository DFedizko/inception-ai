const SIGNED_16_BIT_SCALE = 0x8000;

export const rmsLevel = (samples: Float32Array): number => {
  if (samples.length === 0) return 0;
  let sumOfSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    sumOfSquares += samples[index] * samples[index];
  }
  const rootMeanSquare = Math.sqrt(sumOfSquares / samples.length);
  return Math.min(1, Math.sqrt(rootMeanSquare) * 3.2);
};

export const peakLevel = (pcm: Int16Array): number => {
  if (pcm.length === 0) return 0;
  let peak = 0;
  for (let index = 0; index < pcm.length; index += 1) {
    const magnitude = Math.abs(pcm[index]) / SIGNED_16_BIT_SCALE;
    if (magnitude > peak) peak = magnitude;
  }
  return Math.min(1, Math.pow(peak, 0.6) * 2.2);
};
