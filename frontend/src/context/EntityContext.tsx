"use client";

/**
 * context/EntityContext.tsx
 *
 * Domain context cho Entities — actors, institutions, supreme entities.
 * Refetch khi tick thay đổi (từ SimulationCoreContext).
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useSimulationCore } from './SimulationCoreContext';

export interface Actor {
  id: number;
  name: string;
  universe_id: number;
  species?: string;
  archetype?: string;
  status?: string;
  age?: number;
  energy?: number;
  power_level?: number;
  alignment?: Record<string, number>;
  motivations?: Record<string, number>;
  is_heroic?: boolean;
  is_isekai?: boolean;
  is_transcendental?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface Institution {
  id: number;
  name: string;
  type?: string;
  power?: number;
  legitimacy?: number;
  [key: string]: unknown;
}

interface EntityContextType {
  actors: Actor[];
  institutions: Institution[];
  supremeEntities: unknown[];
  entitiesLoading: boolean;
  entitiesError: string | null;
  refreshEntities: () => Promise<void>;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const { universeId, latestSnapshot } = useSimulationCore();
  const [actors, setActors] = useState<Actor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [supremeEntities, setSupremeEntities] = useState<unknown[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitiesError, setEntitiesError] = useState<string | null>(null);

  const refreshEntities = useCallback(async () => {
    if (!universeId) return;
    setEntitiesLoading(true);
    try {
      const [actorRes, instRes, supremeRes] = await Promise.all([
        api.actors(universeId),
        api.institutions(universeId),
        api.supremeEntities(universeId),
      ]);
      setActors(actorRes.data || actorRes || []);
      setInstitutions(instRes.data || instRes || []);
      setSupremeEntities(supremeRes.data || supremeRes || []);
      setEntitiesError(null);
    } catch (e: unknown) {
      setEntitiesError((e as { message?: string }).message ?? 'Unknown error');
    } finally {
      setEntitiesLoading(false);
    }
  }, [universeId]);

  // Refetch when tick changes
  const prevTickRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (!universeId) return;
    const tick = latestSnapshot?.tick ?? null;
    if (tick !== null && tick !== prevTickRef.current) {
      prevTickRef.current = tick;
      const t = setTimeout(() => refreshEntities(), 2000);
      return () => clearTimeout(t);
    }
  }, [universeId, latestSnapshot?.tick, refreshEntities]);

  // Initial load
  useEffect(() => {
    if (universeId) refreshEntities();
  }, [universeId, refreshEntities]);

  const value = React.useMemo(() => ({
    actors, institutions, supremeEntities,
    entitiesLoading, entitiesError, refreshEntities,
  }), [actors, institutions, supremeEntities, entitiesLoading, entitiesError, refreshEntities]);

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}

export function useEntities() {
  const context = useContext(EntityContext);
  if (!context) throw new Error('useEntities must be used within an EntityProvider');
  return context;
}
