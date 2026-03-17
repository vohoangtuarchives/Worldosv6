import React, { useMemo } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { Handshake, ShieldAlert, Swords, Network, Flame } from "lucide-react";

export function DiplomacyPanel({ universeId }: { universeId: number }) {
  const { latestSnapshot, institutions } = useSimulation();

  const diplomacyData = latestSnapshot?.state_vector?.civilization?.diplomacy;
  const factions = (institutions || []).filter((e: any) => e.entity_type === "CIVILIZATION" || e.entity_type === "FACTION");

  const factionMap = useMemo(() => {
    const map: Record<number, any> = {};
    factions.forEach((f: any) => {
      map[f.id] = f;
    });
    return map;
  }, [factions]);

  if (!diplomacyData || !diplomacyData.tensions) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-card/10 rounded-xl border border-border/50">
        <Network className="w-12 h-12 mb-4 opacity-20" />
        <p>No diplomatic activities recorded.</p>
        <p className="text-xs opacity-50 mt-2">Vũ trụ chưa phát sinh quan hệ ngoại giao phức tạp.</p>
      </div>
    );
  }

  const { active_treaties = {}, tensions = {} } = diplomacyData;

  // Flatten active treaties for display
  const treatiesList: any[] = [];
  Object.keys(active_treaties).forEach((sourceIdStr) => {
    const sourceId = parseInt(sourceIdStr);
    const targets = active_treaties[sourceId];
    if (targets) {
      Object.keys(targets).forEach((targetIdStr) => {
        const targetId = parseInt(targetIdStr);
        // To avoid duplicates, only add if source < target
        if (sourceId < targetId) {
          const types = targets[targetId];
          treatiesList.push({ sourceId, targetId, types });
        }
      });
    }
  });

  // Tension List
  const tensionList = Object.keys(tensions).map((key) => {
    const [idA, idB] = key.split("_").map(Number);
    return {
      idA,
      idB,
      tension: tensions[key].tension,
      has_alliance: tensions[key].has_alliance,
    };
  }).sort((a, b) => b.tension - a.tension);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500">
      
      {/* Căng thẳng & Nguy cơ chiến tranh */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
          <Flame className="w-4 h-4" /> Global Tensions
        </h3>
        <div className="grid gap-3">
          {tensionList.length > 0 ? (
            tensionList.map((t, idx) => {
              const nameA = factionMap[t.idA]?.name || `Faction ${t.idA}`;
              const nameB = factionMap[t.idB]?.name || `Faction ${t.idB}`;
              const isHighTension = t.tension > 0.8;
              const isLowTension = t.tension < 0.3;
              
              return (
                <div key={idx} className={`p-4 rounded-xl border ${isHighTension ? "bg-red-950/20 border-red-500/30" : isLowTension ? "bg-emerald-950/10 border-emerald-500/20" : "bg-card/30 border-border/50"} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{nameA}</span>
                    {t.has_alliance ? (
                      <Handshake className="w-4 h-4 text-emerald-400" />
                    ) : isHighTension ? (
                      <Swords className="w-4 h-4 text-red-400 animate-pulse" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="font-semibold text-sm">{nameB}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full overflow-hidden bg-background">
                    <div 
                      className={`absolute top-0 left-0 bottom-0 ${isHighTension ? "bg-red-500" : isLowTension ? "bg-emerald-500" : "bg-amber-500"}`} 
                      style={{ width: `${t.tension * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>TENSION</span>
                    <span>{(t.tension * 100).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground p-4 bg-card/10 border border-border/20 rounded-lg">Không có dữ liệu căng thẳng.</div>
          )}
        </div>
      </div>

      {/* Hiệp ước & Liên minh */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <Handshake className="w-4 h-4" /> Active Treaties
        </h3>
        <div className="grid gap-3">
          {treatiesList.length > 0 ? (
            treatiesList.map((treaty, idx) => {
              const nameA = factionMap[treaty.sourceId]?.name || `Civ ${treaty.sourceId}`;
              const nameB = factionMap[treaty.targetId]?.name || `Civ ${treaty.targetId}`;
              
              return (
                <div key={idx} className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-200 text-sm">{nameA}</span>
                    <span className="text-xs text-blue-400/70">↔</span>
                    <span className="font-medium text-blue-200 text-sm">{nameB}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {treaty.types.map((type: string, tIdx: number) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground p-4 bg-card/10 border border-border/20 rounded-lg">Không có hiệp ước nào đang hiệu lực.</div>
          )}
        </div>
      </div>
    </div>
  );
}
