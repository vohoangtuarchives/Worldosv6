/**
 * hooks/useAuditTrail.ts
 *
 * Hook để fetch và quản lý Audit Trail data từ Phase 8 API.
 * Cung cấp: danh sách manifests, chi tiết tick, replay result.
 */

import { useState, useCallback } from 'react';
import { auditApi } from '@/lib/api/audit';
import type { TickManifest, ReplayResult } from '@/types/simulation';

interface UseAuditTrailReturn {
  manifests: TickManifest[];
  selectedManifest: TickManifest | null;
  replayResult: ReplayResult | null;
  isLoading: boolean;
  isReplaying: boolean;
  error: string | null;
  fetchManifests: (universeId: number, limit?: number) => Promise<void>;
  fetchManifest: (universeId: number, tick: number) => Promise<void>;
  triggerReplay: (universeId: number, tick: number) => Promise<void>;
  clearResult: () => void;
}

export function useAuditTrail(): UseAuditTrailReturn {
  const [manifests, setManifests] = useState<TickManifest[]>([]);
  const [selectedManifest, setSelectedManifest] = useState<TickManifest | null>(null);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManifests = useCallback(async (universeId: number, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditApi.manifests(universeId, limit);
      setManifests(result.data ?? []);
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchManifest = useCallback(async (universeId: number, tick: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditApi.manifest(universeId, tick);
      setSelectedManifest(result);
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Failed to load tick manifest');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerReplay = useCallback(async (universeId: number, tick: number) => {
    setIsReplaying(true);
    setReplayResult(null);
    setError(null);
    try {
      const result = await auditApi.replay(universeId, tick);
      setReplayResult(result);
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Replay failed');
    } finally {
      setIsReplaying(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setReplayResult(null);
    setSelectedManifest(null);
    setError(null);
  }, []);

  return {
    manifests, selectedManifest, replayResult,
    isLoading, isReplaying, error,
    fetchManifests, fetchManifest, triggerReplay, clearResult,
  };
}
