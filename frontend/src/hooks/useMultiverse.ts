'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { MultiverseBloom, MultiverseResonance } from '@/types/api';

// ── Multiverse Bloom ────────────────────────────
// GET /apex/multiverse/bloom → MultiverseBloom | { data: MultiverseBloom }

export function useMultiverseBloom() {
  const { data, error, isLoading } = useQuery<MultiverseBloom>({
    queryKey: ['multiverse', 'bloom'],
    queryFn: async () => {
      const res = await api.get('/apex/multiverse/bloom');
      const payload = res.data;
      // Handle both { data: MultiverseBloom } and direct MultiverseBloom
      if (payload && typeof payload === 'object' && 'data' in payload && payload.data?.worlds) {
        return payload.data as MultiverseBloom;
      }
      return payload as MultiverseBloom;
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return {
    bloom: data,
    isLoading,
    isError: error,
  };
}

// ── Multiverse Resonance ────────────────────────
// GET /apex/multiverse/resonance → MultiverseResonance | { data: MultiverseResonance }

export function useMultiverseResonance() {
  const { data, error, isLoading } = useQuery<MultiverseResonance>({
    queryKey: ['multiverse', 'resonance'],
    queryFn: async () => {
      const res = await api.get('/apex/multiverse/resonance');
      const payload = res.data;
      // Handle both { data: MultiverseResonance } and direct MultiverseResonance
      if (
        payload &&
        typeof payload === 'object' &&
        'data' in payload &&
        payload.data?.resonance_pollen
      ) {
        return payload.data as MultiverseResonance;
      }
      return payload as MultiverseResonance;
    },
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  return {
    resonance: data,
    isLoading,
    isError: error,
  };
}
