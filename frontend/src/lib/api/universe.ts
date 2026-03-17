/**
 * lib/api/universe.ts — Universe & World endpoints
 */
import { apiFetch, buildStreamUrl } from './fetch';
import type { WorldSimulationStatusResponse, UniverseDecisionMetrics } from '@/types/simulation';

export const universeApi = {
  async worlds() {
    return apiFetch("/worldos/worlds");
  },
  async worldSimulationStatus(worldId: number) {
    return apiFetch(`/worldos/worlds/${worldId}/simulation-status`) as Promise<WorldSimulationStatusResponse>;
  },
  worldSimulationStatusStreamUrl(worldId: number): string {
    return buildStreamUrl(`/worldos/worlds/${worldId}/simulation-status/stream`);
  },
  universeSnapshotStreamUrl(universeId: number): string {
    return buildStreamUrl(`/worldos/universes/${universeId}/stream`);
  },
  async universes(params: { world_id?: number; saga_id?: number } = {}) {
    const q = new URLSearchParams();
    if (params.world_id) q.set("world_id", String(params.world_id));
    if (params.saga_id) q.set("saga_id", String(params.saga_id));
    const qs = q.toString();
    return apiFetch(`/worldos/universes${qs ? `?${qs}` : ""}`);
  },
  async universe(id: number) {
    return apiFetch(`/worldos/universes/${id}`);
  },
  async universeDecisionMetrics(universeId: number) {
    return apiFetch(`/worldos/universes/${universeId}/decision-metrics`) as Promise<UniverseDecisionMetrics>;
  },
  async universeIdeology(universeId: number) {
    return apiFetch(`/worldos/universes/${universeId}/ideology`) as Promise<{
      universe_id: number;
      dominant: Record<string, number>;
      institution_count: number;
      previous_dominant: Record<string, number> | null;
    }>;
  },
  async snapshots(id: number, limit = 50) {
    return apiFetch(`/worldos/universes/${id}/snapshots?limit=${limit}`);
  },
  async anomalies(id: number) {
    return apiFetch(`/worldos/universes/${id}/anomalies`);
  },
  async createWorld(payload: { name: string; description?: string; genre?: string }) {
    return apiFetch("/worldos/worlds", { method: "POST", body: JSON.stringify(payload) });
  },
  async exportWorld(id: number) {
    const data = await apiFetch(`/worldos/worlds/${id}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world-${id}-export.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  async importWorld(payload: unknown) {
    return apiFetch("/worldos/worlds/import", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateAxioms(worldId: number, axioms: Record<string, unknown>) {
    return apiFetch(`/worldos/worlds/${worldId}/axiom`, { method: "POST", body: JSON.stringify({ axioms }) });
  },
  async toggleAutonomic(worldId: number) {
    return apiFetch(`/worldos/worlds/${worldId}/toggle-autonomic`, { method: "POST" });
  },
  async pulseWorld(worldId: number, ticksPerUniverse = 10) {
    return apiFetch(`/worldos/worlds/${worldId}/pulse`, { method: "POST", body: JSON.stringify({ ticks_per_universe: ticksPerUniverse }) });
  },
  async worldIp(worldId: number) {
    return apiFetch(`/worldos/worlds/${worldId}/ip`);
  },

  // Phase 9: Multiverse Convergence
  bridges: async (universeId: number) => {
    return apiFetch(`/worldos/universes/${universeId}/bridges`);
  },
  createBridge: async (universeId: number, payload: { target_universe_id: number, bridge_type: string, resonance_level: number }) => {
    return apiFetch(`/worldos/universes/${universeId}/bridges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  destroyBridge: async (universeId: number, bridgeId: number) => {
    return apiFetch(`/worldos/universes/${universeId}/bridges/${bridgeId}`, {
      method: 'DELETE'
    });
  },
  convergenceMap: async (universeId: number) => {
    return apiFetch(`/worldos/universes/${universeId}/convergence-map`);
  }
};
