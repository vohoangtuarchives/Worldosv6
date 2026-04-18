'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Snapshot, BranchSummary, BranchComparison } from '@/types/api';

// ── Advance Simulation ──────────────────────────

export function useAdvanceSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      universeId,
      ticks,
    }: {
      universeId: number;
      ticks: number;
    }) =>
      api
        .post<{ ok: boolean }>('/worldos/simulation/advance', {
          universe_id: universeId,
          ticks,
        })
        .then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      queryClient.invalidateQueries({ queryKey: ['universes', variables.universeId, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['universes', variables.universeId, 'dossier'] });
      queryClient.invalidateQueries({ queryKey: ['universes', variables.universeId, 'snapshots'] });
    },
  });
}

// ── Toggle Universe Status ──────────────────────

export function useToggleUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (universeId: number) =>
      api
        .post<{ ok: boolean; status: string }>(
          `/worldos/universes/${universeId}/toggle-status`,
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
}

// ── Snapshots ───────────────────────────────────

export function useSnapshots(universeId: number | null) {
  const { data, error, isLoading } = useQuery<Snapshot[]>({
    queryKey: ['universes', universeId, 'snapshots'],
    queryFn: () =>
      api
        .get(`/worldos/universes/${universeId}/snapshots`, {
          params: { limit: 50 },
        })
        .then((res) => {
          const payload = res.data;
          return Array.isArray(payload) ? payload : [];
        }),
    enabled: !!universeId,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  return { snapshots: data ?? [], isLoading, isError: !!error };
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (universeId: number) =>
      api
        .post(`/worldos/universes/${universeId}/snapshots`)
        .then((res) => res.data),
    onSuccess: (_data, universeId) => {
      queryClient.invalidateQueries({
        queryKey: ['universes', universeId, 'snapshots'],
      });
    },
  });
}

// ── Forks / Branches ────────────────────────────

export function useForks(universeId: number | null) {
  const { data, error, isLoading } = useQuery<BranchSummary[]>({
    queryKey: ['universes', universeId, 'forks'],
    queryFn: () =>
      api
        .get(`/worldos/universes/${universeId}/forks`)
        .then((res) => {
          const payload = res.data;
          return Array.isArray(payload) ? payload : [];
        }),
    enabled: !!universeId,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  return { forks: data ?? [], isLoading, isError: !!error };
}

export function useForkUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      universeId,
      tick,
      name,
    }: {
      universeId: number;
      tick?: number;
      name?: string;
    }) =>
      api
        .post<{ ok: boolean; child_universe_id: number }>(
          `/worldos/universes/${universeId}/fork`,
          { tick, name },
        )
        .then((res) => res.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['universes', variables.universeId, 'forks'],
      });
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
}

export function useCompareBranch(
  universeId: number | null,
  branchId: number | null,
  enabled = true,
) {
  const { data, error, isLoading, isFetching } = useQuery<BranchComparison>({
    queryKey: ['universes', universeId, 'forks', 'compare', branchId],
    queryFn: () =>
      api
        .get(`/worldos/universes/${universeId}/forks/compare`, {
          params: { branch_id: branchId },
        })
        .then((res) => res.data),
    enabled: enabled && !!universeId && !!branchId,
    staleTime: 15_000,
  });

  return {
    comparison: data ?? null,
    isLoading,
    isFetching,
    isError: !!error,
  };
}

// ── Create Universe ─────────────────────────────

export function useCreateUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, base_genre }: { name: string; base_genre: string }) =>
      api
        .post('/worldos/universes', { name, base_genre })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
}

// ── Delete Universe ─────────────────────────────

export function useDeleteUniverse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (universeId: number) =>
      api.delete(`/worldos/universes/${universeId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
}
