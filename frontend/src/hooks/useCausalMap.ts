'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TopologyData, CausalLinkData, RealityState } from '@/types/api';

// ── Topology ────────────────────────────────────

export function useTopology(universeId: number | null) {
  const { data, isLoading, error, refetch } = useQuery<TopologyData>({
    queryKey: ['topology', universeId],
    queryFn: async () => {
      const res = await api.get(`/apex/v10/universes/${universeId}/topology`);
      const payload = res.data;
      // API may wrap in { data: ... } or return directly
      return payload?.data ?? payload;
    },
    enabled: !!universeId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return { topology: data, isLoading, error, refetch };
}

// ── Causal Links ────────────────────────────────

export function useCausalLinks(
  universeId: number | null,
  fromTick?: number,
  toTick?: number,
) {
  const { data, isLoading, error, refetch } = useQuery<CausalLinkData>({
    queryKey: ['causal-links', universeId, fromTick, toTick],
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (fromTick !== undefined) params.from_tick = fromTick;
      if (toTick !== undefined) params.to_tick = toTick;
      const res = await api.get(`/worldos/universes/${universeId}/causal-links`, { params });
      const payload = res.data;
      return payload?.data ?? payload;
    },
    enabled: false, // manual refetch only
  });

  return { causalLinks: data, isLoading, error, refetch };
}

// ── Reality State ───────────────────────────────

export function useRealityState(universeId: number | null) {
  const { data, isLoading, error } = useQuery<RealityState>({
    queryKey: ['reality-state', universeId],
    queryFn: async () => {
      const res = await api.get(`/worldos/universes/${universeId}/reality-state`);
      const payload = res.data;
      return payload?.data ?? payload;
    },
    enabled: !!universeId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return { realityState: data, isLoading, error };
}
