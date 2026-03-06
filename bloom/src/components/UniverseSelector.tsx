"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type World = { id: number; name: string; slug: string; multiverse_id: number };
type Universe = { id: number; world_id: number; world?: World; saga_id?: number };

export default function UniverseSelector() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worldId, setWorldId] = useState<number | "">("");
  const [universeId, setUniverseId] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.worlds().then((w: World[]) => {
      setWorlds(w);
      const savedUniverse = typeof window !== "undefined" ? window.localStorage.getItem("universe_id") : null;
      if (savedUniverse) {
        setUniverseId(Number(savedUniverse));
        // We need to fetch the universe details to get its world_id
        api.universe(Number(savedUniverse)).then((u: Universe) => {
          if (u && u.world_id) {
            setWorldId(u.world_id);
          }
        });
      }
    });
  }, []);

  const handleWorldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : "";
    setWorldId(val);
    if (!val) setUniverses([]);
  };

  useEffect(() => {
    let active = true;
    if (worldId) {
      api.universes({ world_id: worldId }).then((u: Universe[]) => {
        if (!active) return;
        setUniverses(u || []);
        if (universeId) {
          const belongs = u?.find(item => item.id === universeId);
          if (!belongs) setUniverseId("");
        }
      });
    }
    return () => { active = false; };
  }, [worldId, universeId]);

  useEffect(() => {
    if (universeId && typeof window !== "undefined") {
      window.localStorage.setItem("universe_id", String(universeId));
    }
  }, [universeId]);

  const universeOptions = useMemo(() => {
    return universes.map((u) => ({ value: u.id, label: `Universe #${u.id}` }));
  }, [universes]);

  const seed = () => {
    setBusy(true);
    api
      .seedDemo()
      .then((res: { universe_id: number }) => {
        const id = res.universe_id;
        setUniverseId(id);
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={worldId}
        onChange={handleWorldChange}
      >
        <option value="">Chọn World</option>
        {worlds.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={universeId}
        onChange={(e) => setUniverseId(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Chọn Universe</option>
        {universeOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        className="h-9 rounded-[var(--radius)] border border-border bg-card px-3 text-sm hover:bg-muted"
        onClick={seed}
        disabled={busy}
      >
        {busy ? "Seeding..." : "Seed Demo"}
      </button>
    </div>
  );
}
