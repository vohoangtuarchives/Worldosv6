const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
  async snapshots(id: number, limit = 50) {
    return apiFetch(`/worldos/universes/${id}/snapshots?limit=${limit}`);
  },
  async chronicle(id: number, page = 1, limit = 10) {
    return apiFetch(`/worldos/universes/${id}/chronicles?page=${page}&limit=${limit}`);
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
  async topology(id: number) {
    return apiFetch(`/worldos/universes/${id}/topology`);
  },
  async branchEvents(id: number) {
    return apiFetch(`/worldos/universes/${id}/branch-events`);
  },
  async socialContracts(id: number) {
    return apiFetch(`/worldos/universes/${id}/social-contracts`);
  },

  // -----------------------------------------------------------------------
  // IP Factory Pipeline
  // -----------------------------------------------------------------------
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
    async loomStatus() {
      return apiFetch("/worldos/ip-factory/loom-status");
    },
  },
};
