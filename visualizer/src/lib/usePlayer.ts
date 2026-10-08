import { useCallback, useEffect, useRef, useState } from 'react';
import type { Trace } from '../engine';

export const SPEEDS = [0.5, 1, 2, 4, 8] as const;
const BASE_MS = 1100;

/** Playback state for a trace: current step, play/pause, speed and smart jumps. */
export function usePlayer(trace: Trace | null) {
  const total = trace?.steps.length ?? 0;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const timer = useRef<number | undefined>(undefined);

  // new trace → start from the top (but keep speed)
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [trace]);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(total - 1, i)), [total]);
  const go = useCallback((i: number) => setIndex(clamp(i)), [clamp]);

  useEffect(() => {
    if (!playing) return;
    if (index >= total - 1) {
      setPlaying(false);
      return;
    }
    // linger a little longer on decisions and printing — those are the "aha" moments
    const k = trace?.steps[index]?.kind;
    const weight = k === 'branch' || k === 'switch' || k === 'input' ? 1.5 : k === 'loop-update' ? 0.7 : 1;
    timer.current = window.setTimeout(() => setIndex((i) => clamp(i + 1)), (BASE_MS * weight) / speed);
    return () => window.clearTimeout(timer.current);
  }, [playing, index, speed, total, trace, clamp]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && index >= total - 1) setIndex(0);
      return !p;
    });
  }, [index, total]);

  /** jump to the first step after the innermost loop running now has finished */
  const skipLoop = useCallback(() => {
    if (!trace) return;
    const cur = trace.steps[index];
    const loop = cur?.loops.at(-1);
    if (!loop) return go(index + 1);
    for (let i = index + 1; i < total; i++) {
      if (!trace.steps[i].loops.some((l) => l.id === loop.id)) return go(i);
    }
    go(total - 1);
  }, [trace, index, total, go]);

  /** next time a given source line runs (after the current step) */
  const runToLine = useCallback(
    (line: number) => {
      if (!trace) return;
      for (let i = index + 1; i < total; i++) if (trace.steps[i].line === line) return go(i);
      for (let i = 0; i <= index; i++) if (trace.steps[i].line === line) return go(i);
    },
    [trace, index, total, go],
  );

  return { index, total, playing, speed, setSpeed, go, toggle, setPlaying, skipLoop, runToLine, step: trace?.steps[index] ?? null };
}

export type Player = ReturnType<typeof usePlayer>;
