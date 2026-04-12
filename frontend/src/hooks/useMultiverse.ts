'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useCentrifugoConnection, useAdaptiveRefetchInterval } from '@/hooks/useCentrifugo';
import type { MultiverseBloom, MultiverseResonance } from '@/types/api';

// ── Multiverse Bloom ────────────────────────────

export function useMultiverseBloom() {
  const { state } = useCentrifugoConnection();
  const refetchInterval = useAdaptiveRefetchInterval(state, 15_000);

  const { data, error, isLoading } = useQuery<MultiverseBloom>({
    queryKey: ['multiverse', 'bloom'],
    queryFn: () =>
      api.get('/apex/multiverse/bloom').then((res) => res.data),
    refetchInterval,
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
  const { state } = useCentrifugoConnection();
  const refetchInterval = useAdaptiveRefetchInterval(state, 10_000);

  const { data, error, isLoading } = useQuery<MultiverseResonance>({
    queryKey: ['multiverse', 'resonance'],
    queryFn: () =>
      api.get('/apex/multiverse/resonance').then((res) => res.data),
    refetchInterval,
    refetchOnWindowFocus: true,
  });

  return {
    resonance: data,
    isLoading,
    isError: !!error,
  };
}
