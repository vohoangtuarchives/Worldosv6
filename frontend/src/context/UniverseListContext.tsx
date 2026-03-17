"use client";

/**
 * context/UniverseListContext.tsx
 *
 * Context cho danh sách universes — refetch on window focus.
 * Tách ra để tránh re-rendering components khi list thay đổi.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { UniverseSimulationItem } from '@/types/simulation';

interface UniverseListContextType {
  universes: UniverseSimulationItem[];
  universesLoading: boolean;
  refreshUniverses: () => Promise<void>;
}

const UniverseListContext = createContext<UniverseListContextType | undefined>(undefined);

export function UniverseListProvider({ children }: { children: React.ReactNode }) {
  const [universes, setUniverses] = useState<UniverseSimulationItem[]>([]);
  const [universesLoading, setUniversesLoading] = useState(false);

  const refreshUniverses = React.useCallback(async () => {
    setUniversesLoading(true);
    try {
      const res = await api.universes({});
      setUniverses(res.data || res || []);
    } catch (e) {
      console.error('Failed to fetch universes list', e);
    } finally {
      setUniversesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUniverses();
    window.addEventListener('focus', refreshUniverses);
    return () => window.removeEventListener('focus', refreshUniverses);
  }, [refreshUniverses]);

  const value = React.useMemo(() => ({
    universes, universesLoading, refreshUniverses,
  }), [universes, universesLoading, refreshUniverses]);

  return <UniverseListContext.Provider value={value}>{children}</UniverseListContext.Provider>;
}

export function useUniverseList() {
  const context = useContext(UniverseListContext);
  if (!context) throw new Error('useUniverseList must be used within a UniverseListProvider');
  return context;
}
