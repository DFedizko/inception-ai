import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { useAudioSink } from "./useAudioSink";

type SourceNode = {
  buffer: FakeAudioBuffer | null;
  onended: (() => void) | null;
  connect: () => void;
  start: (when: number) => void;
  stop: () => void;
  startedAt: number;
};

class FakeAudioBuffer {
  channelData: Float32Array;
  constructor(public length: number, public sampleRate: number) {
    this.channelData = new Float32Array(length);
  }
  getChannelData() {
    return this.channelData;
  }
}

const startedSources: SourceNode[] = [];

class FakeAudioContext {
  sampleRate: number;
  currentTime = 0;
  destination = {};
  closed = false;
  state: "running" | "suspended" = "running";

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate ?? 24000;
  }

  createBuffer(_channels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer(length, sampleRate);
  }

  createBufferSource(): SourceNode {
    const node: SourceNode = {
      buffer: null,
      onended: null,
      connect: () => {},
      start: (when: number) => {
        node.startedAt = when;
        startedSources.push(node);
      },
      stop: () => {},
      startedAt: 0,
    };
    return node;
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

const originalAudioContext = (globalThis as { AudioContext?: unknown }).AudioContext;

const drainLastSource = () => {
  const node = startedSources[startedSources.length - 1];
  node?.onended?.();
};

beforeEach(() => {
  startedSources.length = 0;
  (globalThis as { AudioContext?: unknown }).AudioContext = FakeAudioContext;
});

afterEach(() => {
  (globalThis as { AudioContext?: unknown }).AudioContext = originalAudioContext;
});

describe("useAudioSink", () => {
  it("plays enqueued PCM and flips isPlaying on", () => {
    const { result } = renderHook(() => useAudioSink());

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.start();
      result.current.enqueue(new Int16Array([0, 16000, -16000, 32767]));
    });

    expect(result.current.isPlaying).toBe(true);
    expect(startedSources.length).toBe(1);
    expect(startedSources[0].buffer?.length).toBe(4);
    expect(result.current.error).toBeNull();
  });

  it("schedules consecutive frames gaplessly back-to-back", () => {
    const { result } = renderHook(() => useAudioSink());

    act(() => {
      result.current.start();
      result.current.enqueue(new Int16Array(24000));
      result.current.enqueue(new Int16Array(24000));
    });

    expect(startedSources.length).toBe(2);
    expect(startedSources[1].startedAt).toBeGreaterThanOrEqual(startedSources[0].startedAt + 1);
  });

  it("returns to idle when the queue drains", () => {
    const { result } = renderHook(() => useAudioSink());

    act(() => {
      result.current.start();
      result.current.enqueue(new Int16Array([1, 2, 3, 4]));
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      drainLastSource();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("stops playback and goes idle", () => {
    const { result } = renderHook(() => useAudioSink());

    act(() => {
      result.current.start();
      result.current.enqueue(new Int16Array([1, 2, 3, 4]));
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("sets error when the Web Audio API is unsupported", () => {
    (globalThis as { AudioContext?: unknown }).AudioContext = undefined;
    const { result } = renderHook(() => useAudioSink());

    act(() => {
      result.current.start();
      result.current.enqueue(new Int16Array([1, 2, 3, 4]));
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
