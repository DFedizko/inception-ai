const TARGET_SAMPLE_RATE = 16000;
const CHUNK_MS = 100;

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_SAMPLE_RATE;
    this.chunkSize = Math.floor((TARGET_SAMPLE_RATE * CHUNK_MS) / 1000);
    this.buffer = new Float32Array(this.chunkSize);
    this.bufferIndex = 0;
    this.inAcc = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      this.inAcc += 1;
      if (this.inAcc >= this.ratio) {
        this.inAcc -= this.ratio;
        this.buffer[this.bufferIndex++] = channel[i];
        if (this.bufferIndex >= this.chunkSize) {
          this.emitChunk();
        }
      }
    }
    return true;
  }

  emitChunk() {
    const out = new Int16Array(this.chunkSize);
    let rms = 0;
    for (let i = 0; i < this.chunkSize; i++) {
      const s = Math.max(-1, Math.min(1, this.buffer[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      rms += s * s;
    }
    rms = Math.sqrt(rms / this.chunkSize);
    const perceived = Math.min(1, Math.pow(rms, 0.5) * 3.2);
    this.port.postMessage({ pcm: out, level: perceived }, [out.buffer]);
    this.bufferIndex = 0;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
