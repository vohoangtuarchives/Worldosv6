import { queryOptions } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Snapshot, BranchSummary } from '@/types/api';

export const simulationQueries = {
  /** Snapshots for a universe */
  snapshots: (universeId: number) =>
    queryOptions({
      queryKey: ['universes', universeId, 'snapshots'] as const,
      queryFn: (): Promise<Snapshot[]> =>
        api
          .get(`/worldos/universes/${universeId}/snapshots`, { params: { limit: 50 } })
          .then((r) => {
            const d = r.data;
            return Array.isArray(d) ? d : [];
          }),
      staleTime: 10_000,
      refetchInterval: 15_000,
      enabled: universeId > 0,
    }),

  /** Forks / branches for a universe */
  forks: (universeId: number) =>
    queryOptions({
      queryKey: ['universes', universeId, 'forks'] as const,
      queryFn: (): Promise<BranchSummary[]> =>
        api
          .get(`/worldos/universes/${universeId}/forks`)
          .then((r) => {
            const d = r.data;
            return Array.isArray(d) ? d : [];
          }),
      staleTime: 10_000,
      refetchInterval: 15_000,
      enabled: universeId > 0,
    }),

  /** Settings / config (no refetch interval — manual refresh) */
  config: () =>
    queryOptions({
      queryKey: ['simulation', 'settings'] as const,
      queryFn: () => api.get('/simulation/settings').then((r) => r.data),
      staleTime: 30_000,
    }),
};
