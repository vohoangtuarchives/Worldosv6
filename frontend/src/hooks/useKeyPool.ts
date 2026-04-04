'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AiKeyMetadata {
    url?: string;
    model?: string;
    [key: string]: unknown;
}

export interface AiKey {
    id: number;
    provider: string;
    label: string;
    tier: 'free' | 'premium';
    level: number;
    usage_count: number;
    status: 'active' | 'inactive' | 'cooldown';
    last_used_at: string | null;
    cooldown_until: string | null;
    model_group?: string;
    metadata?: AiKeyMetadata;
    key_preview?: string;
}

export interface AiKeyPayload {
    provider: string;
    label: string;
    key?: string;
    tier: 'free' | 'premium';
    status?: 'active' | 'inactive' | 'cooldown';
    level: number;
    model_group?: string;
    metadata?: AiKeyMetadata;
}

export function useKeyPool() {
    const queryClient = useQueryClient();

    const { data: keys = [], isLoading, error } = useQuery<AiKey[]>({
        queryKey: ['ai-key-pool'],
        queryFn: async () => {
            const res = await api.get('/ai-key-pool');
            return res.data;
        },
        refetchInterval: 10000,
    });

    const addMutation = useMutation({
        mutationFn: async (newKey: AiKeyPayload & { key: string }) => {
            const res = await api.post('/ai-key-pool', newKey);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-key-pool'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: AiKeyPayload }) => {
            const res = await api.put(`/ai-key-pool/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-key-pool'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/ai-key-pool/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-key-pool'] });
        },
    });

    return {
        keys,
        isLoading,
        error,
        addKey: addMutation.mutateAsync,
        updateKey: updateMutation.mutateAsync,
        deleteKey: deleteMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isUpdating: updateMutation.isPending,
    };
}
