'use client';

import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Chronicle, MythScar, Artifact } from '@/types/api';

export function useChronicles(universeId: number | null) {
    const { data, error, isLoading } = useQuery<Chronicle[]>({
        queryKey: ['universes', universeId, 'chronicles'],
        queryFn: () =>
            api
                .get(`/worldos/universes/${universeId}/chronicles`)
                .then((res) => res.data),
        enabled: !!universeId,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });

    return {
        chronicles: data ?? [],
        isLoading,
        isError: !!error,
    };
}

export function useMythScars(universeId: number | null) {
    const { data, error, isLoading } = useQuery<MythScar[]>({
        queryKey: ['universes', universeId, 'myth-scars'],
        queryFn: () =>
            api
                .get(`/worldos/universes/${universeId}/myth-scars`)
                .then((res) => res.data),
        enabled: !!universeId,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });

    return {
        mythScars: data ?? [],
        isLoading,
        isError: !!error,
    };
}

export function useArtifacts(universeId: number | null) {
    const { data, error, isLoading } = useQuery<Artifact[]>({
        queryKey: ['universes', universeId, 'artifacts'],
        queryFn: () =>
            api
                .get(`/worldos/universes/${universeId}/artifacts`)
                .then((res) => res.data),
        enabled: !!universeId,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });

    return {
        artifacts: data ?? [],
        isLoading,
        isError: !!error,
    };
}
