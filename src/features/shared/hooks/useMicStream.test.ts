import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useMicStream } from "./useMicStream";

type WorkletMessage = { data: { pcm: Int16Array; level: number } };
type WorkletPort = { onmessage: ((event: WorkletMessage) => void) | null };

let lastWorklet: { port: WorkletPort; disconnect: () => void } | null = null;
const stoppedTracks: boolean[] = [];

const fakeStream = { getTracks: () => [{ stop: () => stoppedTracks.push(true) }] };

class FakeAudioContext {
  state = "running";
  audioWorklet = { addModule: async () => {} };
  createMediaStreamSource() {
    return { connect: () => {}, disconnect: () => {} };
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

class FakeAudioWorkletNode {
  port: WorkletPort = { onmessage: null };
  constructor() {
    lastWorklet = this;
  }
  disconnect() {}
}

const emit = (pcm: Int16Array, level = 0.5) => lastWorklet?.port.onmessage?.({ data: { pcm, level } });

const originalMediaDevices = navigator.mediaDevices;
const scope = globalThis as { AudioContext?: unknown; AudioWorkletNode?: unknown };
const originalAudioContext = scope.AudioContext;
const originalAudioWorkletNode = scope.AudioWorkletNode;

const setMediaDevices = (value: unknown) =>
  Object.defineProperty(navigator, "mediaDevices", { value, configurable: true, writable: true });

beforeEach(() => {
  lastWorklet = null;
  stoppedTracks.length = 0;
  setMediaDevices({ getUserMedia: async () => fakeStream });
  scope.AudioContext = FakeAudioContext;
  scope.AudioWorkletNode = FakeAudioWorkletNode;
});

afterEach(() => {
  setMediaDevices(originalMediaDevices);
  scope.AudioContext = originalAudioContext;
  scope.AudioWorkletNode = originalAudioWorkletNode;
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

  it("forwards PCM16 frames and the level posted by the capture worklet", async () => {
    const frames: Int16Array[] = [];
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start((frame) => frames.push(frame));
    });

    const chunk = Int16Array.from([0, 16383, -16384, 32767]);
    act(() => {
      emit(chunk, 0.7);
    });

    expect(frames).toEqual([chunk]);
    expect(result.current.getLevel()).toBeCloseTo(0.7);
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

  it("releases the microphone even when worklet setup fails (no leak)", async () => {
    class BlockedContext extends FakeAudioContext {
      audioWorklet = {
        addModule: async () => {
          throw new Error("worklet blocked");
        },
      };
    }
    scope.AudioContext = BlockedContext;
    const { result } = renderHook(() => useMicStream());

    await act(async () => {
      await result.current.start(() => {});
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
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
    scope.AudioContext = undefined;
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
