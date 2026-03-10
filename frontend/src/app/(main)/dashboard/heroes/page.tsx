"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { HeroCard, type HeroCardEntity } from "@/components/Simulation/HeroCard";
import { useSimulation } from "@/context/SimulationContext";

export default function HeroesPage() {
  const { universeId: contextUniverseId } = useSimulation();
  const [filter, setFilter] = useState<string>("All");
  const [heroes, setHeroes] = useState<HeroCardEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [universeId, setUniverseId] = useState<number | null>(null);

  useEffect(() => {
    const id = contextUniverseId ?? (typeof window !== "undefined" ? Number(window.localStorage.getItem("universe_id")) : null);
    setUniverseId(id ?? null);
  }, [contextUniverseId]);

  useEffect(() => {
    if (universeId == null) {
      setLoading(false);
      setHeroes([]);
      return;
    }
    setLoading(true);
    api
      .greatPersons(universeId)
      .then((data: HeroCardEntity[]) => {
        setHeroes(Array.isArray(data) ? data : []);
      })
      .catch(() => setHeroes([]))
      .finally(() => setLoading(false));
  }, [universeId]);

  const filteredHeroes = useMemo(() => {
    if (filter === "All") return heroes;
    return heroes.filter((h) => h.domain === filter || h.entity_type === filter || getTypeLabel(h.entity_type) === filter);
  }, [heroes, filter]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    heroes.forEach((h) => {
      if (h.domain) set.add(h.domain);
      set.add(getTypeLabel(h.entity_type));
    });
    return ["All", ...Array.from(set).sort()];
  }, [heroes]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-64 border-r border-border bg-card/40 p-4 space-y-6 overflow-y-auto shrink-0">
        <div>
          <div className="font-semibold text-lg text-foreground px-2 mb-2">Loại vĩ nhân</div>
          <nav className="space-y-1">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setFilter(domain)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filter === domain ? "bg-muted text-amber-400 font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {domain}
                <span className="ml-auto float-right text-xs opacity-50">
                  {domain === "All" ? heroes.length : heroes.filter((h) => h.domain === domain || getTypeLabel(h.entity_type) === domain).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos glow-cosmos-text">
            Vĩ nhân / Heroes
          </h2>
          {universeId != null && (
            <span className="text-sm text-muted-foreground font-mono">Universe {universeId}</span>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card/40 h-64 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filteredHeroes.length === 0 && (
          <p className="text-muted-foreground">
            {universeId == null
              ? "Chọn universe để xem danh sách vĩ nhân."
              : "Chưa có vĩ nhân nào trong universe này. Vĩ nhân xuất hiện khi simulation đạt điều kiện (entropy, institutions, cooldown)."}
          </p>
        )}

        {!loading && filteredHeroes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHeroes.map((entity) => (
              <HeroCard key={entity.id} entity={entity} universeId={universeId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(entityType: string): string {
  const key = (entityType || "").replace(/^great_person_/, "");
  const labels: Record<string, string> = {
    prophet: "Tiên tri",
    general: "Đại tướng",
    sage: "Hiền nhân",
    builder: "Kiến trúc sư",
    scholar: "Đại học giả",
  };
  return labels[key] ?? entityType;
}
