'use client';

import useSWR from 'swr';

import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

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
    const { data, error, isLoading } = useSWR<UniverseOption[] | ResourceCollection<UniverseOption>>(
        '/worldos/universes',
        fetcher,
        {
            refreshInterval: 15000,
            revalidateOnFocus: true,
        }
    );

    const universes = Array.isArray(data) ? data : data?.data ?? [];

    return {
        universes,
        isLoading,
        isError: error,
    };
}

export function useUniverseMetrics(universeId?: number | null) {
    const key = universeId ? `/worldos/universes/${universeId}/metrics` : null;
    const { data, error, isLoading, mutate } = useSWR<UniverseMetrics>(key, fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true,
    });

    return {
        metrics: data,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useUniverseDossier(universeId?: number | null) {
    const key = universeId ? `/worldos/universes/${universeId}/dossier` : null;
    const { data, error, isLoading, mutate } = useSWR<UniverseDossier>(key, fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true,
    });

    return {
        dossier: data,
        isLoading,
        isError: error,
        mutate,
    };
}
