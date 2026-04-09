'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TopologyData, CausalLinkData, RealityState } from '@/types/api';

// ── Topology ────────────────────────────────────

export function useTopology(universeId: number | null) {
  const { data, isLoading, error, refetch } = useQuery<TopologyData>({
    queryKey: ['topology', universeId],
    queryFn: () =>
      api
        .get(`/apex/v10/universes/${universeId}/topology`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return { topology: data, isLoading, isError: !!error, refetch };
}

// ── Causal Links ────────────────────────────────

export function useCausalLinks(
  universeId: number | null,
  fromTick?: number,
  toTick?: number,
) {
  const { data, isLoading, error, refetch } = useQuery<CausalLinkData>({
    queryKey: ['causal-links', universeId, fromTick, toTick],
    queryFn: () => {
      const params: Record<string, number> = {};
      if (fromTick !== undefined) params.from_tick = fromTick;
      if (toTick !== undefined) params.to_tick = toTick;
      return api
        .get(`/worldos/universes/${universeId}/causal-links`, { params })
        .then((res) => res.data);
    },
    enabled: false, // manual refetch only
  });

  return { causalLinks: data, isLoading, isError: !!error, refetch };
}

// ── Reality State ───────────────────────────────

export function useRealityState(universeId: number | null) {
  const { data, isLoading, error } = useQuery<RealityState>({
    queryKey: ['reality-state', universeId],
    queryFn: () =>
      api
        .get(`/worldos/universes/${universeId}/reality-state`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return { realityState: data, isLoading, isError: !!error };
}
