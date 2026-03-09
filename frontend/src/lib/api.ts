import type { NarrativeFact } from "@/types/narrative";
import type { NarrativePreset } from "@/lib/narrative-studio";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

async function publicFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    let errText = "";
    try {
      const data = await res.json();
      errText = data.message || JSON.stringify(data);
    } catch {
      errText = await res.text();
    }
    throw new Error(errText || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let errText = "";
    try {
      const data = (await res.json()) as Record<string, unknown> & { message?: string; errors?: Record<string, string[]> };
      errText =
        (Array.isArray(data.errors?.email) && data.errors.email[0]) ||
        (data.errors && typeof data.errors === "object" && Object.values(data.errors)[0]?.[0]) ||
        data.message ||
        JSON.stringify(data);
    } catch {
      errText = await res.text().catch(() => `HTTP ${res.status}`);
    }
    throw new Error(errText || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const api = {
  async login(email: string, password: string) {
    return apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  async logout() {
    return apiFetch("/logout", { method: "POST" });
  },
  async me() {
    return apiFetch("/user");
  },
  async worlds() {
    return apiFetch("/worldos/worlds");
  },
  async worldSimulationStatus(worldId: number) {
    return apiFetch(`/worldos/worlds/${worldId}/simulation-status`) as Promise<
      import("@/types/simulation").WorldSimulationStatusResponse
    >;
  },
  /** URL for SSE stream (realtime simulation status). Use with EventSource. Token in query for auth (EventSource cannot send headers). */
  worldSimulationStatusStreamUrl(worldId: number): string {
    const base = process.env.NEXT_PUBLIC_API_URL || "/api";
    const url = `${base}/worldos/worlds/${worldId}/simulation-status/stream`;
    const token = getToken();
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },
  /** URL for SSE stream (realtime snapshot updates per universe). Use with EventSource. Token in query for auth. */
  universeSnapshotStreamUrl(universeId: number): string {
    const base = process.env.NEXT_PUBLIC_API_URL || "/api";
    const url = `${base}/worldos/universes/${universeId}/stream`;
    const token = getToken();
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },
  async worldIp(worldId: number) {
    return apiFetch(`/worldos/worlds/${worldId}/ip`) as Promise<{
      world: { id: number; name: string; slug?: string; current_genre?: string; base_genre?: string };
      universes: Array<{
        id: number;
        name: string;
        series: Array<{ id: number; title: string; slug?: string; chapters?: Array<{ id: number; title: string; chapter_index: number }> }>;
        chronicles: Array<{ id: number; from_tick: number; to_tick: number; content: string; type?: string }>;
      }>;
      aggregated_bibles: { characters: unknown[]; lore: unknown[] };
    }>;
  },
  async createWorld(payload: { name: string; description?: string; genre?: string }) {
    return apiFetch("/worldos/worlds", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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
    return apiFetch(`/worldos/universes/${universeId}/decision-metrics`) as Promise<
      import("@/types/simulation").UniverseDecisionMetrics
    >;
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
  async materialDag(id: number) {
    return apiFetch(`/worldos/universes/${id}/material-dag`);
  },
  async seedDemo() {
    return apiFetch(`/worldos/demo/seed`, { method: "POST" });
  },
  async advance(universe_id: number, ticks: number) {
    return apiFetch(`/worldos/simulation/advance`, {
      method: "POST",
      body: JSON.stringify({ universe_id, ticks }),
    });
  },
  async fork(universeId: number, tick?: number) {
    return apiFetch(`/worldos/universes/${universeId}/fork`, {
      method: "POST",
      body: JSON.stringify({ tick: tick ?? 0 }),
    });
  },
  async pulseWorld(worldId: number, ticksPerUniverse = 10) {
    return apiFetch(`/worldos/worlds/${worldId}/pulse`, {
      method: "POST",
      body: JSON.stringify({ ticks_per_universe: ticksPerUniverse }),
    });
  },
  async toggleAutonomic(worldId: number) {
    return apiFetch(`/worldos/worlds/${worldId}/toggle-autonomic`, { method: "POST" });
  },
  async updateAxioms(worldId: number, axioms: Record<string, unknown>) {
    return apiFetch(`/worldos/worlds/${worldId}/axiom`, {
      method: "POST",
      body: JSON.stringify({ axioms }),
    });
  },
  async getAgentConfig() {
    return apiFetch("/worldos/agent-config");
  },
  async saveAgentConfig(config: Record<string, unknown>) {
    return apiFetch("/worldos/agent-config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },
  async graph(id: number) {
    return apiFetch(`/worldos/universes/${id}/graph`);
  },
  async anomalies(id: number) {
    return apiFetch(`/worldos/universes/${id}/anomalies`);
  },
  async institutions(id: number) {
    return apiFetch(`/worldos/universes/${id}/institutions`);
  },
  async supremeEntities(id: number) {
    return apiFetch(`/worldos/universes/${id}/supreme-entities`);
  },
  async edicts() {
    return apiFetch("/worldos/edicts");
  },
  async decree(id: number, edictId: string) {
    return apiFetch(`/worldos/universes/${id}/decree`, {
      method: "POST",
      body: JSON.stringify({ edict_id: edictId }),
    });
  },
  async interactions(id: number) {
    return apiFetch(`/worldos/universes/${id}/interactions`);
  },
  async scenarios() {
    return apiFetch("/worldos/scenarios");
  },
  async trajectories(universeId: number) {
    return apiFetch(`/worldos/universes/${universeId}/causal-trajectories`);
  },
  async launchScenario(id: number, scenarioId: string) {
    return apiFetch(`/worldos/universes/${id}/scenario`, {
      method: "POST",
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
  },
  async actors(id: number) {
    return apiFetch(`/worldos/universes/${id}/actors`);
  },
  async biologyMetrics(id: number) {
    return apiFetch(`/worldos/universes/${id}/biology-metrics`) as Promise<{
      avg_energy: number;
      median_energy: number;
      starving_count: number;
      total_alive: number;
      species_count: number;
      species_distribution: Record<string, number>;
      trait_avg: Record<number, number>;
      instability_score?: number;
      ecological_collapse_active?: boolean;
      ecological_collapse_until_tick?: number | null;
      ecological_collapse_since_tick?: number | null;
      ecological_collapse_type?: string | null;
      current_tick?: number;
    }>;
  },
  async historyTimeline(id: number, limit?: number) {
    const q = limit != null ? `?limit=${limit}` : "";
    return apiFetch(`/worldos/universes/${id}/history-timeline${q}`) as Promise<{
      timeline: { from_tick: number; to_tick: number; type: string; content: string | null; payload: Record<string, unknown> }[];
      by_type: Record<string, { from_tick: number; to_tick: number; type: string; content: string | null; payload: Record<string, unknown> }[]>;
    }>;
  },
  async societyMetrics(id: number) {
    return apiFetch(`/worldos/universes/${id}/society-metrics`) as Promise<{
      current_tick: number;
      settlements: Record<string, { level: string; governance: string; population: number; resource_surplus: number }>;
      total_population: number;
      economy: { total_surplus: number; total_consumption: number; updated_tick: number } | null;
      politics: { military_power: number; economic_power: number; legitimacy: number; stability: number; updated_tick: number } | null;
      war: { military_power: number; conflict_pressure: number; updated_tick: number } | null;
    }>;
  },
  async environmentMetrics(id: number) {
    return apiFetch(`/worldos/universes/${id}/environment-metrics`) as Promise<{
      current_tick: number;
      zones: {
        id: number | string;
        temperature: number | null;
        rainfall: number | null;
        ecosystem_state: string | null;
        target_ecosystem_state: string | null;
        transition_progress: number | null;
        elevation: number | null;
        terrain_type: string | null;
        mineral_richness: number | null;
        ice_coverage: number | null;
      }[];
    }>;
  },
  async topology(id: number) {
    return apiFetch(`/worldos/universes/${id}/topology`);
  },
  async branchEvents(id: number) {
    return apiFetch(`/worldos/universes/${id}/branch-events`);
  },
  async mythScars(id: number) {
    return apiFetch(`/worldos/universes/${id}/myth-scars`) as Promise<{ id: number; name: string; description: string | null; severity: string }[]>;
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
      return apiFetch("/worldos/narrative-studio/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },

  ipFactory: {
    async series() {
      return apiFetch("/worldos/ip-factory/series");
    },
    async getSeries(id: number) {
      return apiFetch(`/worldos/ip-factory/series/${id}`);
    },
    async createSeries(payload: {
      universe_id: number;
      title: string;
      genre_key?: string;
      saga_id?: number;
      config?: Record<string, unknown>;
    }) {
      return apiFetch("/worldos/ip-factory/series", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async chapters(seriesId: number) {
      return apiFetch(`/worldos/ip-factory/series/${seriesId}/chapters`);
    },
    async generateChapter(seriesId: number, sync = false) {
      return apiFetch(
        `/worldos/ip-factory/series/${seriesId}/generate-chapter${sync ? "?sync=true" : ""}`,
        { method: "POST" }
      );
    },
    async canonize(seriesId: number, chapterId: number) {
      return apiFetch(
        `/worldos/ip-factory/series/${seriesId}/chapters/${chapterId}/canonize`,
        { method: "POST" }
      );
    },
    async bible(seriesId: number) {
      return apiFetch(`/worldos/ip-factory/series/${seriesId}/bible`);
    },
  },

  publicSeries: {
    async show(slug: string) {
      return publicFetch(`/public/series/${encodeURIComponent(slug)}`);
    },
    async chapters(slug: string) {
      return publicFetch(`/public/series/${encodeURIComponent(slug)}/chapters`);
    },
    async chapter(slug: string, chapterId: number) {
      return publicFetch(`/public/series/${encodeURIComponent(slug)}/chapters/${chapterId}`);
    },
    async bible(slug: string) {
      return publicFetch(`/public/series/${encodeURIComponent(slug)}/bible`);
    },
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
  async importWorld(payload: any) {
    return apiFetch("/worldos/worlds/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  labDashboard: {
    async state(universeId?: number | null) {
      const q = universeId != null ? `?universe_id=${universeId}` : "";
      return apiFetch(`/worldos/lab/dashboard/state${q}`);
    },
    async attractors() {
      return apiFetch("/worldos/lab/dashboard/attractors");
    },
    async evolution() {
      return apiFetch("/worldos/lab/dashboard/evolution");
    },
    async risks() {
      return apiFetch("/worldos/lab/dashboard/risks");
    },
    async intelligence() {
      return apiFetch("/worldos/lab/dashboard/intelligence");
    },
    async intervene(statePayload: any = {}) {
      return apiFetch("/worldos/lab/dashboard/intervene", {
        method: "POST",
        body: JSON.stringify({ state: statePayload }),
      });
    }
  },
  /** Redis Streams: read observer events (last_id, multiverse_id?, count?) */
  async observerStream(params: { lastId?: string; multiverseId?: number | null; count?: number } = {}) {
    const q = new URLSearchParams();
    q.set("last_id", params.lastId ?? "0");
    if (params.multiverseId != null) q.set("multiverse_id", String(params.multiverseId));
    q.set("count", String(params.count ?? 50));
    return apiFetch(`/worldos/observer/stream?${q.toString()}`) as Promise<{ entries: { id: string; data: Record<string, string> }[] }>;
  },
  /** URL for SSE stream (realtime observer events). Use with EventSource. Token in query for auth. */
  observerStreamSseUrl(multiverseId?: number | null): string {
    const base = process.env.NEXT_PUBLIC_API_URL || "/api";
    const q = new URLSearchParams();
    if (multiverseId != null) q.set("multiverse_id", String(multiverseId));
    const token = getToken();
    if (token) q.set("token", token);
    const qs = q.toString();
    return `${base}/worldos/observer/stream/sse${qs ? `?${qs}` : ""}`;
  },
};

