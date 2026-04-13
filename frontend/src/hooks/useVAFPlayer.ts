"use client";

// ──────────────────────────────────────────────
// VAF Player Hook
// Combines timeline reducer + rAF loop + effect scheduler
// ──────────────────────────────────────────────

import { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';

import type { AnimationScript } from '@/lib/vaf/types';
import type { VAFEffect, VAFScene } from '@/lib/vaf/types';
import type { TimelineState } from '@/lib/vaf/timeline';
import {
  timelineReducer,
  computeSceneIndex,
  computeSceneElapsedMs,
} from '@/lib/vaf/timeline';
import { EffectScheduler } from '@/lib/vaf/scheduler';

// ── Initial State Factory ───────────────────────

function createInitialState(script: AnimationScript | null): TimelineState {
  return {
    status: 'idle',
    currentSceneIndex: 0,
    elapsedMs: 0,
    totalDurationMs: script?.total_duration_ms ?? 0,
  };
}

// ── Hook ────────────────────────────────────────

export interface VAFPlayerReturn {
  state: TimelineState;
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  restart: () => void;
  currentScene: VAFScene | null;
  activeEffects: VAFEffect[];
  progress: number;
}

export function useVAFPlayer(script: AnimationScript | null): VAFPlayerReturn {
  const [state, dispatch] = useReducer(timelineReducer, script, createInitialState);

  // Refs for the rAF loop
  const rafIdRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  // Build scene durations array
  const sceneDurations = useMemo(
    () => (script?.scenes ?? []).map((s) => s.duration_ms),
    [script],
  );

  // Build effect scheduler
  const schedulerRef = useRef<EffectScheduler | null>(null);
  useEffect(() => {
    schedulerRef.current = new EffectScheduler(script?.scenes ?? []);
  }, [script]);

  // Compute derived values
  const currentSceneIndex = useMemo(
    () => computeSceneIndex(state.elapsedMs, sceneDurations),
    [state.elapsedMs, sceneDurations],
  );

  const sceneElapsedMs = useMemo(
    () => computeSceneElapsedMs(state.elapsedMs, sceneDurations),
    [state.elapsedMs, sceneDurations],
  );

  const currentScene = script?.scenes[currentSceneIndex] ?? null;

  const activeEffects = useMemo(
    () => schedulerRef.current?.getActiveEffects(currentSceneIndex, sceneElapsedMs) ?? [],
    [currentSceneIndex, sceneElapsedMs],
  );

  const progress =
    state.totalDurationMs > 0 ? state.elapsedMs / state.totalDurationMs : 0;

  // ── rAF Loop ──────────────────────────────────

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (deltaMs > 0) {
        dispatch({ type: 'TICK', deltaMs });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  useEffect(() => {
    if (state.status === 'playing') {
      lastTimestampRef.current = 0; // Reset so first frame has zero delta
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [state.status, tick]);

  // Reset state when script changes
  useEffect(() => {
    dispatch({ type: 'RESTART' });
  }, [script]);

  // ── Actions ───────────────────────────────────

  const play = useCallback(() => dispatch({ type: 'PLAY' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const seek = useCallback((ms: number) => dispatch({ type: 'SEEK', ms }), []);
  const restart = useCallback(() => dispatch({ type: 'RESTART' }), []);

  return {
    state,
    play,
    pause,
    seek,
    restart,
    currentScene,
    activeEffects,
    progress,
  };
}
