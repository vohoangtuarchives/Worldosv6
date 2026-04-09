'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { intelligenceQueries } from '../api/queries';
import api from '@/lib/api';

interface AiLogFilters {
  feature?: string;
  driver?: string;
  model?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAiLogs(filters: AiLogFilters = {}) {
  const queryClient = useQueryClient();
  const opts = intelligenceQueries.logs(filters);
  const { data, error, isLoading } = useQuery(opts);

  const clearLogs = async () => {
    await api.delete('/ai-logs/clear');
    await queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
  };

  const mutate = () =>
    queryClient.invalidateQueries({ queryKey: ['ai-logs'] });

  return {
    logs: data?.data ?? [],
    pagination: data
      ? {
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        }
      : null,
    isLoading,
    isError: !!error,
    mutate,
    clearLogs,
  };
}

export function useAiStats() {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery(intelligenceQueries.stats());

  const mutate = () =>
    queryClient.invalidateQueries({ queryKey: ['ai-logs', 'stats'] });

  return { stats: data, isLoading, isError: !!error, mutate };
}
