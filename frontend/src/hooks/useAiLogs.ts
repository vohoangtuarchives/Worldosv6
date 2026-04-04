'use client';

import useSWR from 'swr';

import api from '@/lib/api';

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export interface AiLog {
    id: number;
    feature: string;
    driver: string;
    model: string | null;
    input: JsonValue;
    output: JsonValue;
    latency_ms: number;
    status: 'success' | 'error';
    error_message?: string;
    created_at: string;
}

export interface PaginatedAiLogs {
    data: AiLog[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export interface AiStats {
    total_requests: number;
    success_rate: number;
    avg_latency: number;
    providers: { name: string; count: number }[];
    models: { name: string; count: number }[];
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useAiLogs(
    filters: {
        feature?: string;
        driver?: string;
        model?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}
) {
    const { 
        feature, 
        driver, 
        model, 
        status, 
        search,
        page = 1, 
        limit = 15 
    } = filters;

    const params = new URLSearchParams();
    if (feature) params.append('feature', feature);
    if (driver) params.append('driver', driver);
    if (model) params.append('model', model);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const { data, error, isLoading, mutate } = useSWR<PaginatedAiLogs>(
        `/ai-logs?${params.toString()}`,
        fetcher,
        {
            refreshInterval: 5000,
            revalidateOnFocus: true,
        }
    );

    const clearLogs = async () => {
        await api.delete('/ai-logs/clear');
        mutate();
    };

    return {
        logs: data?.data || [],
        pagination: data
            ? {
                  current_page: data.current_page,
                  last_page: data.last_page,
                  total: data.total,
              }
            : null,
        isLoading,
        isError: error,
        mutate,
        clearLogs,
    };
}

export function useAiStats() {
    const { data, error, isLoading, mutate } = useSWR<AiStats>(
        '/ai-logs/stats',
        fetcher,
        {
            refreshInterval: 5000,
            revalidateOnFocus: true,
        }
    );

    return {
        stats: data,
        isLoading,
        isError: error,
        mutate,
    };
}
