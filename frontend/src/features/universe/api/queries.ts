import { queryOptions } from '@tanstack/react-query';
import api from '@/lib/api';
import type { UniverseOption } from '@/hooks/useUniverseDossier';
import type { UniverseMetrics, UniverseDossier } from '@/hooks/useUniverseDossier';

// ── Universe list ────────────────────────────────

interface ResourceCollection<T> {
  data?: T[];
}

export const universeQueries = {
  /** All universes list */
  list: () =>
    queryOptions({
      queryKey: ['universes'] as const,
      queryFn: (): Promise<UniverseOption[] | ResourceCollection<UniverseOption>> =>
        api.get('/worldos/universes').then((r) => r.data),
      staleTime: 10_000,
      refetchInterval: 15_000,
    }),

  /** Aggregated metrics for a single universe */
  metrics: (id: number) =>
    queryOptions({
      queryKey: ['universes', id, 'metrics'] as const,
      queryFn: (): Promise<UniverseMetrics> =>
        api.get(`/worldos/universes/${id}/metrics`).then((r) => r.data),
      staleTime: 8_000,
      refetchInterval: 10_000,
      enabled: id > 0,
    }),

  /** Full dossier for a single universe */
  dossier: (id: number) =>
    queryOptions({
      queryKey: ['universes', id, 'dossier'] as const,
      queryFn: (): Promise<UniverseDossier> =>
        api.get(`/worldos/universes/${id}/dossier`).then((r) => r.data),
      staleTime: 8_000,
      refetchInterval: 10_000,
      enabled: id > 0,
    }),
};
