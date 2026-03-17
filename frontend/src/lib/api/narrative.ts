/**
 * lib/api/narrative.ts — Chronicles, narrative studio, historian endpoints
 */
import { apiFetch } from './fetch';
import type { NarrativeFact } from "@/types/narrative";
import type { NarrativePreset } from "@/lib/narrative-studio";

export const narrativeApi = {
  async chronicle(id: number, page = 1, limit = 10) {
    return apiFetch(`/worldos/universes/${id}/chronicles?page=${page}&limit=${limit}`);
  },
  async generateEpicChronicle(universeId: number, fromTick: number, toTick: number) {
    const res = await apiFetch(`/worldos/universes/${universeId}/generate-chronicle`, {
      method: "POST",
      body: JSON.stringify({ from_tick: fromTick, to_tick: toTick }),
    }) as { data: { id: number; content: string; from_tick: number; to_tick: number } };
    return res.data;
  },
  async historianGenerate(
    universeId: number,
    options?: { output_type?: "history_volume" | "historian_essay" | "philosophy_treatise"; from_tick?: number; to_tick?: number; theme?: string; actor_id?: number }
  ) {
    const res = await apiFetch(`/worldos/universes/${universeId}/historian/generate`, {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    }) as { data: { id: number; type: string; content: string; from_tick: number; to_tick: number } };
    return res.data;
  },
  async trajectories(universeId: number) {
    return apiFetch(`/worldos/universes/${universeId}/causal-trajectories`);
  },
  async causalLinks(id: number, fromTick?: number, toTick?: number) {
    const q = new URLSearchParams();
    if (fromTick != null) q.set("from_tick", String(fromTick));
    if (toTick != null) q.set("to_tick", String(toTick));
    const qs = q.toString();
    return apiFetch(`/worldos/universes/${id}/causal-links${qs ? `?${qs}` : ""}`);
  },
  async historyTimeline(id: number, limit?: number) {
    const q = limit != null ? `?limit=${limit}` : "";
    return apiFetch(`/worldos/universes/${id}/history-timeline${q}`);
  },
  async mythScars(id: number) {
    return apiFetch(`/worldos/universes/${id}/myth-scars`);
  },
  async branchEvents(id: number) {
    return apiFetch(`/worldos/universes/${id}/branch-events`);
  },
  async socialContracts(id: number) {
    return apiFetch(`/worldos/universes/${id}/social-contracts`);
  },
  narrativeStudio: {
    async generate(payload: {
      universe_id: number;
      preset: NarrativePreset;
      facts: NarrativeFact[];
      current_draft?: string;
      epic_chronicle?: string;
    }) {
      return apiFetch("/worldos/narrative-studio/generate", { method: "POST", body: JSON.stringify(payload) });
    },
  },
};
