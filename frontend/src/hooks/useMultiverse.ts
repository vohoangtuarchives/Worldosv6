'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { MultiverseBloom, MultiverseResonance } from '@/types/api';

// ── Multiverse Bloom ────────────────────────────

export function useMultiverseBloom() {
  const { data, error, isLoading } = useQuery<MultiverseBloom>({
    queryKey: ['multiverse', 'bloom'],
    queryFn: () =>
      api.get('/apex/multiverse/bloom').then((res) => res.data),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return {
    bloom: data,
    isLoading,
    isError: !!error,
  };
}

// ── Multiverse Resonance ────────────────────────

export function useMultiverseResonance() {
  const { data, error, isLoading } = useQuery<MultiverseResonance>({
    queryKey: ['multiverse', 'resonance'],
    queryFn: () =>
      api.get('/apex/multiverse/resonance').then((res) => res.data),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  return {
    resonance: data,
    isLoading,
    isError: !!error,
  };
}
