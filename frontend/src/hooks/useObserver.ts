"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

export interface ObserverEntry {
  id: string;
  data: Record<string, string>;
}

export interface UseObserverOptions {
  /** Poll interval in ms. Default 2000. Set 0 to disable. Ignored when using SSE. */
  intervalMs?: number;
  /** Multiverse id for scoped stream, or null for global. */
  multiverseId?: number | null;
  /** Max entries per request (used by backend SSE). */
  count?: number;
}

/**
 * Subscribe to observer events via SSE (realtime). Replaces previous polling.
 * Use when simulation is running to show snapshot/event updates without full page refresh.
 */
export function useObserver(options: UseObserverOptions = {}) {
  const { intervalMs = 2000, multiverseId = null } = options;
  const [entries, setEntries] = useState<ObserverEntry[]>([]);
  const [lastId, setLastId] = useState("0");
  const [error, setError] = useState<Error | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (intervalMs <= 0) return;

    const url = api.observerStreamSseUrl(multiverseId);
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { entries?: ObserverEntry[]; last_id?: string };
        const list = payload?.entries ?? [];
        if (list.length > 0) {
          setEntries((prev) => [...prev, ...list]);
          const nextId = list[list.length - 1]?.id ?? payload?.last_id ?? "0";
          setLastId(nextId);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    };

    es.onerror = () => {
      setError(new Error("Observer SSE connection error"));
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [intervalMs, multiverseId]);

  const poll = useCallback(async () => {
    try {
      const res = await api.observerStream({ lastId, multiverseId, count: options.count ?? 50 });
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
  }, [lastId, multiverseId, options.count]);

  return { entries, lastId, error, poll };
}
