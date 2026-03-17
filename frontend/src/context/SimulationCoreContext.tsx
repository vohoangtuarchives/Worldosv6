"use client";

/**
 * context/SimulationCoreContext.tsx
 *
 * Core simulation context — quản lý vital data:
 * - universeId (selected universe)
 * - universe (full universe data)
 * - latestSnapshot (tick, entropy, stability_index, metrics)
 * - anomalies
 * - SSE realtime connection
 * - isPaused control
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { Universe, WorldStateSnapshot, Anomaly } from '@/types/simulation';

interface SimulationCoreContextType {
  universeId: number | null;
  setUniverseId: (id: number | null) => void;
  universe: Universe | null;
  setUniverse: React.Dispatch<React.SetStateAction<Universe | null>>;
  latestSnapshot: WorldStateSnapshot | null;
  setLatestSnapshot: React.Dispatch<React.SetStateAction<WorldStateSnapshot | null>>;
  anomalies: Anomaly[];
  loading: boolean;
  error: string | null;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  refresh: () => Promise<void>;
}

const SimulationCoreContext = createContext<SimulationCoreContextType | undefined>(undefined);

export function SimulationCoreProvider({ children }: { children: React.ReactNode }) {
  const [universeId, _setUniverseId] = useState<number | null>(null);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<WorldStateSnapshot | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const isFetching = useRef(false);

  const setUniverseId = useCallback((id: number | null) => {
    _setUniverseId(id);
    if (typeof window !== 'undefined') {
      if (id != null) window.localStorage.setItem('universe_id', String(id));
      else window.localStorage.removeItem('universe_id');
    }
  }, []);

  // Sync from localStorage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem('universe_id');
    if (stored) _setUniverseId(Number(stored));

    const handleStorage = () => {
      const current = window.localStorage.getItem('universe_id');
      _setUniverseId(current ? Number(current) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchVitalData = useCallback(async (id: number) => {
    const [uRes, snapRes, anomRes] = await Promise.all([
      api.universe(id),
      api.snapshots(id, 1),
      api.anomalies(id),
    ]);

    const u = uRes.data || uRes;
    setUniverse(u as Universe);

    const snaps = snapRes.data || snapRes || [];
    const currentTick = u?.current_tick != null ? Number(u.current_tick) : null;
    if (Array.isArray(snaps) && snaps.length > 0) {
      const snap = snaps[0];
      const snapTick = snap?.tick != null ? Number(snap.tick) : null;
      const tickToUse = currentTick != null && (snapTick == null || currentTick > snapTick)
        ? currentTick : snapTick;
      setLatestSnapshot({ ...snap, tick: tickToUse ?? snap?.tick } as WorldStateSnapshot);
    } else if (currentTick != null) {
      setLatestSnapshot(prev => ({
        tick: currentTick,
        entropy: u?.entropy ?? prev?.entropy,
        stability_index: prev?.stability_index ?? 0,
        metrics: prev?.metrics ?? {},
      } as WorldStateSnapshot));
    }

    const anoms = anomRes.data || anomRes || [];
    setAnomalies(Array.isArray(anoms) ? anoms as Anomaly[] : []);
  }, []);

  const refresh = useCallback(async () => {
    if (!universeId || isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      await fetchVitalData(universeId);
      setError(null);
    } catch (e: unknown) {
      const err = e as { message?: string; status?: number };
      if (err.message?.includes('404') || err.status === 404) {
        setError(`Vũ trụ #${universeId} không tồn tại hoặc đã bị xóa.`);
        setUniverseId(null);
      } else {
        setError(`Lỗi đồng bộ: ${err.message || 'Không xác định'}`);
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [universeId, fetchVitalData, setUniverseId]);

  // Realtime SSE snapshot stream
  useEffect(() => {
    if (!universeId || isPaused || typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let vitalDebounce: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    const connect = () => {
      if (es) es.close();
      es = new EventSource(api.universeSnapshotStreamUrl(universeId));

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLatestSnapshot({
            tick: data.tick,
            entropy: data.entropy,
            stability_index: data.stability_index,
            metrics: data.metrics ?? {},
          } as WorldStateSnapshot);
          retryCount = 0;
          setError(null);

          if (vitalDebounce) clearTimeout(vitalDebounce);
          vitalDebounce = setTimeout(() => {
            fetchVitalData(universeId);
            vitalDebounce = null;
          }, 1500);
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setError(`Đang kết nối lại (${retryCount}/${maxRetries})...`);
          setTimeout(connect, delay);
        } else {
          setError('Mất kết nối realtime. Vui lòng làm mới trang.');
          if (es) es.close();
        }
      };
    };

    connect();
    refresh();

    return () => {
      if (vitalDebounce) clearTimeout(vitalDebounce);
      if (es) es.close();
    };
  }, [universeId, isPaused, fetchVitalData, refresh]);

  const value = React.useMemo(() => ({
    universeId, setUniverseId, universe, setUniverse,
    latestSnapshot, setLatestSnapshot, anomalies,
    loading, error, isPaused, setIsPaused, refresh,
  }), [universeId, setUniverseId, universe, latestSnapshot, anomalies, loading, error, isPaused, refresh]);

  return (
    <SimulationCoreContext.Provider value={value}>
      {children}
    </SimulationCoreContext.Provider>
  );
}

export function useSimulationCore() {
  const context = useContext(SimulationCoreContext);
  if (!context) throw new Error('useSimulationCore must be used within a SimulationCoreProvider');
  return context;
}
