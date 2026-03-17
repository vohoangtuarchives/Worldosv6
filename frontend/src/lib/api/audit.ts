/**
 * lib/api/audit.ts — Phase 8: Audit Trail & Deterministic Replay endpoints
 */
import { apiFetch } from './fetch';
import type { TickManifest, ReplayResult } from '@/types/simulation';

export const auditApi = {
  /** GET /api/worldos/universes/{id}/audit — Lấy danh sách tick manifests */
  async manifests(universeId: number, limit = 20): Promise<{ data: TickManifest[] }> {
    return apiFetch(`/worldos/universes/${universeId}/audit?limit=${limit}`);
  },

  /** GET /api/worldos/universes/{id}/audit/{tick} — Lấy chi tiết manifest của một tick */
  async manifest(universeId: number, tick: number): Promise<TickManifest> {
    return apiFetch(`/worldos/universes/${universeId}/audit/${tick}`);
  },

  /** POST /api/worldos/universes/{id}/audit/{tick}/replay — Trigger deterministic replay */
  async replay(universeId: number, tick: number): Promise<ReplayResult> {
    return apiFetch(`/worldos/universes/${universeId}/audit/${tick}/replay`, { method: "POST" });
  },
};
