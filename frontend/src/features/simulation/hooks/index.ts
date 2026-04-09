'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simulationQueries } from '../api/queries';
import api from '@/lib/api';
import type { BranchComparison } from '@/types/api';

// ── Snapshots ───────────────────────────────────────────────────────

export function useSnapshots(universeId: number | null) {
  const { data, error, isLoading } = useQuery({
    ...simulationQueries.snapshots(universeId ?? 0),
    enabled: !!universeId,
  });
  return { snapshots: data ?? [], isLoading, isError: !!error };
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/worldos/universes/${id}/snapshots`).then((r) => r.data),
    onSuccess: (_, id) =>
      queryClient.invalidateQueries({
        queryKey: simulationQueries.snapshots(id).queryKey,
      }),
  });
}

// ── Forks / Branches ────────────────────────────────────────────────

export function useForks(universeId: number | null) {
  const { data, error, isLoading } = useQuery({
    ...simulationQueries.forks(universeId ?? 0),
    enabled: !!universeId,
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
        .then((r) => r.data),
    onSuccess: (_, { universeId }) => {
      queryClient.invalidateQueries({
        queryKey: simulationQueries.forks(universeId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
}

export function useCompareBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      universeId,
      branchId,
    }: {
      universeId: number;
      branchId: number;
    }) =>
      api
        .post<BranchComparison>(
          `/worldos/universes/${universeId}/forks/compare`,
          { branch_id: branchId },
        )
        .then((r) => r.data),
    onSuccess: (_, { universeId }) =>
      queryClient.invalidateQueries({
        queryKey: simulationQueries.forks(universeId).queryKey,
      }),
  });
}

// ── Advance / Toggle ─────────────────────────────────────────────────

export function useAdvanceSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticks: number) =>
      api
        .post<{ ok: boolean }>('/worldos/simulation/advance', {
          ticks_per_universe: ticks,
        })
        .then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universes'] }),
  });
}

export function useToggleUniverse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api
        .post<{ ok: boolean; status: string }>(
          `/worldos/universes/${id}/toggle-status`,
        )
        .then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universes'] }),
  });
}

// ── Create / Delete Universe ─────────────────────────────────────────

export function useCreateUniverse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, base_genre }: { name: string; base_genre: string }) =>
      api.post('/worldos/universes', { name, base_genre }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universes'] }),
  });
}

export function useDeleteUniverse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/worldos/universes/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universes'] }),
  });
}
