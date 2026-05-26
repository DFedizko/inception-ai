import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useMicStream } from "./useMicStream";

type ProcessorNode = {
  onaudioprocess: ((event: AudioProcessEvent) => void) | null;
  connect: () => void;
  disconnect: () => void;
};

type AudioProcessEvent = { inputBuffer: { getChannelData: (channel: number) => Float32Array } };

let lastProcessor: ProcessorNode | null = null;
const stoppedTracks: boolean[] = [];

const fakeStream = {
  getTracks: () => [{ stop: () => stoppedTracks.push(true) }],
};

class FakeAudioContext {
  sampleRate: number;
  destination = {};
  closed = false;

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate ?? 16000;
  }

  createMediaStreamSource() {
    return { connect: () => {}, disconnect: () => {} };
  }

  createScriptProcessor(): ProcessorNode {
    lastProcessor = { onaudioprocess: null, connect: () => {}, disconnect: () => {} };
    return lastProcessor;
  }

  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

const emitSamples = (samples: number[]) => {
  lastProcessor?.onaudioprocess?.({
    inputBuffer: { getChannelData: () => new Float32Array(samples) },
  });
};

const originalMediaDevices = navigator.mediaDevices;
const originalAudioContext = (globalThis as { AudioContext?: unknown }).AudioContext;

const setMediaDevices = (value: unknown) => {
  Object.defineProperty(navigator, "mediaDevices", {
    value,
    configurable: true,
    writable: true,
  });
};

beforeEach(() => {
  lastProcessor = null;
  stoppedTracks.length = 0;
  setMediaDevices({ getUserMedia: async () => fakeStream });
  (globalThis as { AudioContext?: unknown }).AudioContext = FakeAudioContext;
});

afterEach(() => {
  setMediaDevices(originalMediaDevices);
  (globalThis as { AudioContext?: unknown }).AudioContext = originalAudioContext;
});

describe("useMicStream", () => {
  it("starts capturing and flips isCapturing on", async () => {
    const { result } = renderHook(() => useMicStream());

    expect(result.current.isCapturing).toBe(false);

    await act(async () => {
      await result.current.start(() => {});
    });

    expect(result.current.isCapturing).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("emits PCM16 frames as Int16Array to the onFrame callback", async () => {
    const frames: Int16Array[] = [];
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start((frame) => frames.push(frame));
    });

    act(() => {
      emitSamples([0, 0.5, -0.5, 1]);
    });

    expect(frames.length).toBe(1);
    expect(frames[0]).toBeInstanceOf(Int16Array);
    expect(frames[0].length).toBe(4);
    expect(frames[0][0]).toBe(0);
    expect(frames[0][1]).toBe(Math.round(0.5 * 0x7fff));
    expect(frames[0][3]).toBe(0x7fff);
  });

  it("resamples to 16 kHz when the device rate differs", async () => {
    class HighRateContext extends FakeAudioContext {
      constructor() {
        super({ sampleRate: 48000 });
      }
    }
    (globalThis as { AudioContext?: unknown }).AudioContext = HighRateContext;

    const frames: Int16Array[] = [];
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start((frame) => frames.push(frame));
    });

    act(() => {
      emitSamples(new Array(48).fill(0.25));
    });

    expect(frames.length).toBe(1);
    expect(frames[0].length).toBe(16);
  });

  it("stops capturing and releases the microphone tracks", async () => {
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start(() => {});
    });

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(stoppedTracks.length).toBeGreaterThan(0);
  });

  it("sets error without throwing when permission is denied", async () => {
    setMediaDevices({
      getUserMedia: async () => {
        throw new DOMException("Permission denied", "NotAllowedError");
      },
    });
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start(() => {});
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("sets error when the Web Audio API is unsupported", async () => {
    (globalThis as { AudioContext?: unknown }).AudioContext = undefined;
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start(() => {});
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("sets error when microphone access is unsupported", async () => {
    setMediaDevices(undefined);
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start(() => {});
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
