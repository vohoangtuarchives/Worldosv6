 "use client";
 import { type FormEvent, useEffect, useMemo, useState } from "react";
 import { api } from "@/lib/api";
 
 export default function CosmologicPage() {
  const [universeId, setUniverseId] = useState<number | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("universe_id");
      setUniverseId(stored ? Number(stored) : null);
    }
  }, []);

  type Snapshot = {
    tick: number;
    entropy: number;
    stability_index: number;
    metrics?: Record<string, unknown>;
  };
  const [snap, setSnap] = useState<Snapshot | null>(null);
  type World = {
    id: number;
    name: string;
    slug: string;
    origin?: string;
    current_genre?: string;
    base_genre?: string;
    is_autonomic?: boolean;
    axiom?: Record<string, unknown>;
  };
  type Universe = {
    id: number;
    world_id: number;
    current_tick?: number;
    world?: World;
  };
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [worldName, setWorldName] = useState("");
  const [worldDesc, setWorldDesc] = useState("");
  const [worldGenre, setWorldGenre] = useState("urban");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [ticksPerUniverse, setTicksPerUniverse] = useState(5);
  const [axiomsJson, setAxiomsJson] = useState("{}");
  
  useEffect(() => {
    if (!universeId) return;
    api.universe(universeId).then((u: Universe) => {
      setUniverse(u);
      if (u.world?.axiom) setAxiomsJson(JSON.stringify(u.world.axiom, null, 2));
    });
  }, [universeId]);

  useEffect(() => {
    if (!universeId) return;
    
    let active = true;
    let timeoutId: number;

    const fetchSnap = async () => {
      try {
        const rows = await api.snapshots(universeId, 1);
        if (active) setSnap(rows?.[0] || null);
      } catch (error) {
        console.error("Failed to fetch snapshots:", error);
      } finally {
        if (active) {
          timeoutId = window.setTimeout(fetchSnap, 2500);
        }
      }
    };

    fetchSnap();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [universeId]);

  const handleAdvance = async () => {
    if (!universeId) return;
    try {
      await api.advance(universeId, 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFork = async () => {
    if (!universeId) return;
    try {
      const res = (await api.fork(universeId)) as { child_universe_id?: number };
      if (res.child_universe_id) {
         window.localStorage.setItem("universe_id", String(res.child_universe_id));
         window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeed = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = (await api.seedDemo()) as { universe_id: number };
      window.localStorage.setItem("universe_id", String(res.universe_id));
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Seed demo thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateWorld = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = (await api.createWorld({
        name: worldName,
        description: worldDesc,
        genre: worldGenre,
      })) as { ok: boolean; universe_id?: number; error?: string };
      if (!res.ok) throw new Error(res.error || "Tạo world thất bại");
      if (res.universe_id) {
        window.localStorage.setItem("universe_id", String(res.universe_id));
        window.location.reload();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Tạo world thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handlePulse = async () => {
    if (!universe?.world?.id) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = (await api.pulseWorld(universe.world.id, ticksPerUniverse)) as { ok: boolean };
      setMessage(res.ok ? "Pulse đã chạy" : "Pulse thất bại");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Pulse thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleAutonomic = async () => {
    if (!universe?.world?.id) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = (await api.toggleAutonomic(universe.world.id)) as { ok: boolean; is_autonomic: boolean };
      setUniverse((prev) => (prev ? { ...prev, world: { ...prev.world!, is_autonomic: res.is_autonomic } } : prev));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Toggle thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateAxioms = async () => {
    if (!universe?.world?.id) return;
    setBusy(true);
    setMessage(null);
    try {
      const axioms = JSON.parse(axiomsJson) as Record<string, unknown>;
      await api.updateAxioms(universe.world.id, axioms);
      setMessage("Đã cập nhật axioms");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Cập nhật axioms thất bại");
    } finally {
      setBusy(false);
    }
  };

  const topStats = useMemo(() => {
    const metrics = snap?.metrics || {};
    const getNum = (k: string) => {
      const v = metrics[k];
      return typeof v === "number" ? v : typeof v === "string" ? Number(v) : null;
    };
    return {
      activeZones: getNum("active_zones"),
      population: getNum("population"),
    };
  }, [snap]);

   return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos">Cosmologic Dashboard</h2>
        <div className="flex items-center space-x-2">
          <button 
             onClick={handleAdvance}
             disabled={!universeId}
             className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
             Advance Tick
          </button>
          <button 
             onClick={() => setShowCreateForm(!showCreateForm)}
             className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
             {showCreateForm ? "Hide Form" : "Create World"}
          </button>
          <button 
             onClick={handleFork}
             disabled={!universeId}
             className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
             Fork Universe
          </button>
        </div>
      </div>
      {message && (
        <div className="rounded-xl border border-border bg-card/50 p-4 text-sm">
          {message}
        </div>
      )}
      
      {showCreateForm && (
        <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur mb-4 animate-in fade-in slide-in-from-top-4">
          <div className="text-sm font-semibold">Create World (Spawn Universe)</div>
          <form className="mt-4 grid gap-3" onSubmit={handleCreateWorld}>
            <div className="grid grid-cols-2 gap-4">
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="Tên World"
                required
              />
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={worldGenre}
                onChange={(e) => setWorldGenre(e.target.value)}
                placeholder="Genre (vd: urban, wuxia...)"
              />
            </div>
            <textarea
              className="min-h-24 rounded-md border border-input bg-background p-3 text-sm"
              value={worldDesc}
              onChange={(e) => setWorldDesc(e.target.value)}
              placeholder="Mô tả WorldSeed"
            />
            <div className="flex justify-end">
              <button
                disabled={busy}
                className="h-10 rounded-[var(--radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                type="submit"
              >
                Tạo World
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-1">
        <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="text-sm font-semibold">Universe Setup</div>
          <div className="mt-2 grid gap-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="font-mono">Universe: {universeId ?? "--"}</div>
              <div>World: {universe?.world?.name ?? "--"}</div>
              <div>Genre: {universe?.world?.current_genre ?? "--"}</div>
              <div>Origin: {universe?.world?.origin ?? "--"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleAutonomic}
                disabled={busy || !universe?.world?.id}
                className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
              >
                Autonomic: {universe?.world?.is_autonomic ? "ON" : "OFF"}
              </button>
              <div className="flex items-center gap-2">
                <input
                  className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
                  type="number"
                  value={ticksPerUniverse}
                  onChange={(e) => setTicksPerUniverse(Number(e.target.value))}
                  min={1}
                />
                <button
                  onClick={handlePulse}
                  disabled={busy || !universe?.world?.id}
                  className="h-9 rounded-[var(--radius)] bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Pulse World
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <div className="text-sm font-semibold">World Axioms</div>
            <textarea
              value={axiomsJson}
              onChange={(e) => setAxiomsJson(e.target.value)}
              className="min-h-32 w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
            />
            <div>
              <button
                onClick={handleUpdateAxioms}
                disabled={busy || !universe?.world?.id}
                className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
              >
                Apply Axioms
              </button>
            </div>
          </div>
        </div>
      </div>
      {!universeId && (
        <div className="rounded-xl border border-border bg-card/50 p-6 text-sm text-muted-foreground">
          Chưa chọn Universe. Hãy chọn Universe ở góc phải trên hoặc bấm Seed Demo để tạo dữ liệu.
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Entropy</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{snap?.entropy != null ? `${snap.entropy.toFixed?.(2) ?? snap.entropy}%` : "--"}</div>
          <p className="text-xs text-muted-foreground">{snap ? `Tick ${snap.tick}` : "No data"}</p>
        </div>
        
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Stability Index</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{snap?.stability_index ?? "--"}</div>
          <p className="text-xs text-muted-foreground">{snap ? `Tick ${snap.tick}` : "No data"}</p>
        </div>
        
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Zones</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{topStats.activeZones ?? "--"}</div>
          <p className="text-xs text-muted-foreground">{snap ? `Tick ${snap.tick}` : "No data"}</p>
        </div>
        
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Population</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-2xl font-bold">{topStats.population ?? "--"}</div>
          <p className="text-xs text-muted-foreground">{snap ? `Tick ${snap.tick}` : "No data"}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Physics Simulation</h3>
            <p className="text-sm text-muted-foreground">Real-time pressure distribution across zones.</p>
          </div>
          <div className="p-6 pt-0 pl-2">
            {/* Placeholder for Chart/Canvas */}
            <div className="h-[350px] w-full rounded-md bg-muted/20 flex items-center justify-center border border-dashed border-border">
               <span className="text-muted-foreground text-sm">{snap ? `Tick ${snap.tick}` : "Physics Engine Visualization"}</span>
            </div>
          </div>
        </div>
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
           <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Recent Anomalies</h3>
            <p className="text-sm text-muted-foreground">Detected system irregularities.</p>
          </div>
          <div className="p-6 pt-0">
             <div className="space-y-8">
                {/* Anomaly Items */}
                <div className="flex items-center">
                  <span className="relative flex h-2 w-2 mr-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Void Breach Detected</p>
                    <p className="text-xs text-muted-foreground">Zone 7A - Criticality 98%</p>
                  </div>
                  <div className="ml-auto font-medium text-destructive">CRITICAL</div>
                </div>
                 <div className="flex items-center">
                   <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-4" />
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Resource Depletion</p>
                    <p className="text-xs text-muted-foreground">Zone 3B - Minerals low</p>
                  </div>
                  <div className="ml-auto font-medium text-orange-500">WARN</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
