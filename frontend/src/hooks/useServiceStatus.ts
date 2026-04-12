'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useCentrifugoConnection, useAdaptiveRefetchInterval } from '@/hooks/useCentrifugo';

export interface ServiceCheck {
  status: 'ok' | 'error';
  latency_ms?: number;
  error?: string;
  http_status?: number;
  circuit_breaker?: string;
}

export interface ServiceStatusResponse {
  overall: 'healthy' | 'degraded';
  services: Record<string, ServiceCheck>;
  checked_at: string;
}

export function useServiceStatus() {
  const { state } = useCentrifugoConnection();
  const refetchInterval = useAdaptiveRefetchInterval(state, 30_000);

  const { data, error, isLoading } = useQuery<ServiceStatusResponse>({
    queryKey: ['service-status'],
    queryFn: () =>
      api.get('/worldos/service-status').then((res) => res.data),
    refetchInterval,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });

  const healthyCount = data
    ? Object.values(data.services).filter((s) => s.status === 'ok').length
    : 0;
  const totalCount = data ? Object.keys(data.services).length : 0;

  return {
    serviceStatus: data ?? null,
    isHealthy: data?.overall === 'healthy',
    healthyCount,
    totalCount,
    isLoading,
    isError: !!error,
  };
}
