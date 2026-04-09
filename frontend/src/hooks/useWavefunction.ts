'use client';

import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type {
  WavefunctionData,
  InformationalMass,
  ConsciousnessField,
  AscensionFilterData,
  StateDelta,
} from '@/types/api';

// ── Wavefunction snapshot ───────────────────
export function useWavefunction(universeId: number | null) {
  const { data, error, isLoading } = useQuery<WavefunctionData>({
    queryKey: ['wavefunction', universeId],
    queryFn: () =>
      api
        .get(`/apex/wavefunction/${universeId}`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  return { wavefunction: data, isLoading, isError: !!error };
}

// ── Informational mass ──────────────────────
export function useInformationalMass(universeId: number | null) {
  const { data, error, isLoading } = useQuery<InformationalMass>({
    queryKey: ['informational-mass', universeId],
    queryFn: () =>
      api
        .get(`/apex/informational-mass/${universeId}`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  return { informationalMass: data, isLoading, isError: !!error };
}

// ── Consciousness field ─────────────────────
export function useConsciousness(universeId: number | null) {
  const { data, error, isLoading } = useQuery<ConsciousnessField>({
    queryKey: ['consciousness', universeId],
    queryFn: () =>
      api
        .get(`/apex/v10/universes/${universeId}/consciousness`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  return { consciousness: data, isLoading, isError: !!error };
}

// ── Ascension filters ───────────────────────
export function useAscensionFilters(universeId: number | null) {
  const { data, error, isLoading } = useQuery<AscensionFilterData>({
    queryKey: ['ascension-filters', universeId],
    queryFn: () =>
      api
        .get(`/apex/v10/universes/${universeId}/ascension-filters`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  return { ascensionFilters: data, isLoading, isError: !!error };
}

// ── State delta ─────────────────────────────
export function useStateDelta(universeId: number | null) {
  const { data, error, isLoading } = useQuery<StateDelta>({
    queryKey: ['state-delta', universeId],
    queryFn: () =>
      api
        .get(`/apex/v10/universes/${universeId}/delta`)
        .then((res) => res.data),
    enabled: !!universeId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  return { delta: data, isLoading, isError: !!error };
}
