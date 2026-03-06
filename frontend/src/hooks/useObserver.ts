"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export interface ObserverEntry {
  id: string;
  data: Record<string, string>;
}

export interface UseObserverOptions {
  /** Poll interval in ms. Default 2000. Set 0 to disable. */
  intervalMs?: number;
  /** Multiverse id for scoped stream, or null for global. */
  multiverseId?: number | null;
  /** Max entries per request. */
  count?: number;
}

/**
 * Poll Redis Streams observer endpoint for realtime universe events.
 * Use when simulation is running to show snapshot/event updates without full page refresh.
 */
export function useObserver(options: UseObserverOptions = {}) {
  const { intervalMs = 2000, multiverseId = null, count = 50 } = options;
  const [entries, setEntries] = useState<ObserverEntry[]>([]);
  const [lastId, setLastId] = useState("0");
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await api.observerStream({ lastId, multiverseId, count });
      const list = res?.entries ?? [];
      if (list.length > 0) {
        setEntries((prev) => [...prev, ...list]);
        const nextId = list[list.length - 1]?.id ?? lastId;
        setLastId(nextId);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [lastId, multiverseId, count]);

  useEffect(() => {
    if (intervalMs <= 0) return;
    intervalRef.current = setInterval(poll, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs, poll]);

  return { entries, lastId, error, poll };
}
