"use client";

/**
 * context/WorldDataContext.tsx
 *
 * Domain context cho World Data — materials, interactions, trajectories, chronicles.
 * Refetch ít thường xuyên hơn (mỗi 3 tick thay đổi).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useSimulationCore } from './SimulationCoreContext';
import type { Chronicle } from '@/types/simulation';

interface WorldDataContextType {
  materials: unknown[];
  interactions: unknown[];
  trajectories: unknown[];
  chronicles: Chronicle[];
  worldDataLoading: boolean;
  worldDataError: string | null;
  refreshWorldData: () => Promise<void>;
}

const WorldDataContext = createContext<WorldDataContextType | undefined>(undefined);

export function WorldDataProvider({ children }: { children: React.ReactNode }) {
  const { universeId, latestSnapshot } = useSimulationCore();
  const [materials, setMaterials] = useState<unknown[]>([]);
  const [interactions, setInteractions] = useState<unknown[]>([]);
  const [trajectories, setTrajectories] = useState<unknown[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [worldDataLoading, setWorldDataLoading] = useState(false);
  const [worldDataError, setWorldDataError] = useState<string | null>(null);

  const refreshWorldData = useCallback(async () => {
    if (!universeId) return;
    setWorldDataLoading(true);
    try {
      const [matRes, interRes, trajRes, chronRes] = await Promise.all([
        api.materials(universeId),
        api.interactions(universeId),
        api.trajectories(universeId),
        api.chronicle(universeId),
      ]);
      setMaterials(Array.isArray(matRes) ? matRes : (matRes?.data ?? matRes ?? []));
      setInteractions(interRes.data || interRes || []);
      setTrajectories(trajRes.data || trajRes || []);
      setChronicles(chronRes.data || chronRes || []);
      setWorldDataError(null);
    } catch (e: unknown) {
      setWorldDataError((e as { message?: string }).message ?? 'Unknown error');
    } finally {
      setWorldDataLoading(false);
    }
  }, [universeId]);

  // Refetch every 3 tick changes (world data changes slowly)
  const prevTickRef = useRef<number | null>(null);
  const tickChangeCountRef = useRef(0);
  useEffect(() => {
    if (!universeId) return;
    const tick = latestSnapshot?.tick ?? null;
    if (tick !== null && tick !== prevTickRef.current) {
      prevTickRef.current = tick;
      tickChangeCountRef.current += 1;
      if (tickChangeCountRef.current % 3 === 0) {
        const t = setTimeout(() => refreshWorldData(), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [universeId, latestSnapshot?.tick, refreshWorldData]);

  // Initial load
  useEffect(() => {
    if (universeId) refreshWorldData();
  }, [universeId, refreshWorldData]);

  const value = React.useMemo(() => ({
    materials, interactions, trajectories, chronicles,
    worldDataLoading, worldDataError, refreshWorldData,
  }), [materials, interactions, trajectories, chronicles, worldDataLoading, worldDataError, refreshWorldData]);

  return <WorldDataContext.Provider value={value}>{children}</WorldDataContext.Provider>;
}

export function useWorldData() {
  const context = useContext(WorldDataContext);
  if (!context) throw new Error('useWorldData must be used within a WorldDataProvider');
  return context;
}
