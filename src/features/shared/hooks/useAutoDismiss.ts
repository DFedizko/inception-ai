"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AutoDismiss = {
  paused: boolean;
  pause: () => void;
  resume: () => void;
};

type AutoDismissConfig = {
  duration: number;
  onElapsed: () => void;
};

export const useAutoDismiss = ({ duration, onElapsed }: AutoDismissConfig): AutoDismiss => {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;

  const clear = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const arm = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => onElapsedRef.current(), remainingRef.current);
  }, []);

  useEffect(() => {
    remainingRef.current = duration;
    arm();
    return clear;
  }, [duration, arm, clear]);

  const pause = useCallback(() => {
    clear();
    remainingRef.current = remainingAfterPause(remainingRef.current, startedAtRef.current, Date.now());
    setPaused(true);
  }, [clear]);

  const resume = useCallback(() => {
    setPaused(false);
    arm();
  }, [arm]);

  return { paused, pause, resume };
};

export const remainingAfterPause = (remaining: number, startedAt: number, now: number): number =>
  Math.max(0, remaining - (now - startedAt));
