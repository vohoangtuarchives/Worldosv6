'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

interface ResourceCollection<T> {
    data?: T[];
}

export interface UniverseOption {
    id: number;
    name?: string | null;
    status?: string | null;
    current_tick?: number;
}

export interface UniverseMetrics {
    universe_id: number;
    status: string;
    current_tick: number;
    stability: number;
    entropy: number;
    snapshot_count: number;
    branch_count: number;
    actor_count: number;
    chronicle_count: number;
    anomaly_count: number;
    myth_count: number;
    religion_count: number;
    material_identity: Record<string, unknown>;
    culture_identity: Record<string, unknown>;
}

export interface UniverseDossier {
    universe_id: number;
    name: string | null;
    tick: number;
    status: string;
    material_identity: Record<string, unknown>;
    culture_identity: Record<string, unknown>;
    civilization_profile: Record<string, unknown>;
    civilization: Record<string, unknown>;
    myths: Record<string, unknown>;
    religions: Record<string, unknown>;
    history: Record<string, unknown>;
}

export function useUniverseOptions() {
    const { data, error, isLoading } = useQuery<UniverseOption[] | ResourceCollection<UniverseOption>>({
        queryKey: ['universes'],
        queryFn: () => api.get('/worldos/universes').then((res) => res.data),
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });

    const universes = Array.isArray(data) ? data : data?.data ?? [];

    return {
        universes,
        isLoading,
        isError: !!error,
    };
}

export function useUniverseMetrics(universeId?: number | null) {
    const queryClient = useQueryClient();

    const { data, error, isLoading } = useQuery<UniverseMetrics>({
        queryKey: ['universes', universeId, 'metrics'],
        queryFn: () => api.get(`/worldos/universes/${universeId}/metrics`).then((res) => res.data),
        enabled: !!universeId,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    });

    const mutate = () => queryClient.invalidateQueries({ queryKey: ['universes', universeId, 'metrics'] });

    return {
        metrics: data,
        isLoading,
        isError: !!error,
        mutate,
    };
}

export function useUniverseDossier(universeId?: number | null) {
    const queryClient = useQueryClient();

    const { data, error, isLoading } = useQuery<UniverseDossier>({
        queryKey: ['universes', universeId, 'dossier'],
        queryFn: () => api.get(`/worldos/universes/${universeId}/dossier`).then((res) => res.data),
        enabled: !!universeId,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    });

    const mutate = () => queryClient.invalidateQueries({ queryKey: ['universes', universeId, 'dossier'] });

    return {
        dossier: data,
        isLoading,
        isError: !!error,
        mutate,
    };
}
