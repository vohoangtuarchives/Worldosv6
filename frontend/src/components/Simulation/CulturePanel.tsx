import React, { useMemo } from "react";
import { useSimulation } from "@/context/SimulationContext";
import { Sparkles, Library, Flame, ShieldAlert, Palette, Book, Skull, Ghost, ScrollText } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  ART: <Palette className="w-4 h-4 text-pink-400" />,
  LITERATURE: <Book className="w-4 h-4 text-blue-400" />,
  TABOO: <Skull className="w-4 h-4 text-red-500" />,
  RITUAL: <Ghost className="w-4 h-4 text-purple-400" />,
  NORM: <ScrollText className="w-4 h-4 text-emerald-400" />,
};

const TYPE_COLORS: Record<string, string> = {
  ART: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  LITERATURE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  TABOO: "bg-red-500/10 text-red-400 border-red-500/20",
  RITUAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  NORM: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function CulturePanel({ universeId }: { universeId: number }) {
  const { latestSnapshot, institutions } = useSimulation();

  const cultureData = latestSnapshot?.state_vector?.civilization?.culture?.civ_cultures;
  const factions = (institutions || []).filter((e: any) => e.entity_type === "CIVILIZATION" || e.entity_type === "FACTION");

  const factionMap = useMemo(() => {
    const map: Record<number, any> = {};
    factions.forEach((f: any) => {
      map[f.id] = f;
    });
    return map;
  }, [factions]);

  if (!cultureData || Object.keys(cultureData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-card/10 rounded-xl border border-border/50">
        <Library className="w-12 h-12 mb-4 opacity-20" />
        <p>No cultural artifacts discovered.</p>
        <p className="text-xs opacity-50 mt-2">Văn hóa của các nền văn minh chưa đủ phong phú.</p>
      </div>
    );
  }

  // Flatten culture artifacts
  const allArtifacts: any[] = [];
  const taboos: any[] = [];
  
  Object.keys(cultureData).forEach((civIdStr) => {
    const civId = parseInt(civIdStr);
    const civCulture = cultureData[civId];
    if (civCulture && civCulture.artifacts) {
        civCulture.artifacts.forEach((artifact: any) => {
            const enriched = { ...artifact, civId, civName: factionMap[civId]?.name || `Civ ${civId}` };
            if (artifact.type === "TABOO") {
                taboos.push(enriched);
            } else {
                allArtifacts.push(enriched);
            }
        });
    }
  });

  allArtifacts.sort((a, b) => b.power - a.power);
  taboos.sort((a, b) => b.power - a.power);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500">
      
      {/* Artifact Vault */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Artifact Vault
        </h3>
        <div className="grid gap-3">
          {allArtifacts.length > 0 ? (
            allArtifacts.map((art, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-card/30 border-border/50 flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      {TYPE_ICONS[art.type] || <Sparkles className="w-12 h-12" />}
                  </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{art.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${TYPE_COLORS[art.type] || "bg-foreground/10"}`}>
                      {art.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Civ: <strong className="text-foreground/80">{art.civName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" /> Power: <strong>{art.power.toFixed(1)}</strong>
                    </span>
                    <span className="text-[10px] font-mono opacity-50 ml-auto">Age {art.age}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground p-4 bg-card/10 border border-border/20 rounded-lg">Không có Tác phẩm nghệ thuật, Văn học hoặc Nghi lễ nào.</div>
          )}
        </div>
      </div>

      {/* Taboo List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
          <Skull className="w-4 h-4" /> Global Taboos
        </h3>
        <div className="grid gap-3">
          {taboos.length > 0 ? (
            taboos.map((taboo, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-red-300 text-sm flex items-center gap-2">
                      <Skull className="w-3 h-3 opacity-70" /> {taboo.name}
                  </span>
                  <span className="font-mono text-xs text-red-500/70 opacity-80">
                      Power {taboo.power.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-red-400/80 mt-1 pl-5 border-l border-red-500/20">
                    Vùng cấm kỵ của <strong>{taboo.civName}</strong> vòng đời đã duy trì {taboo.age} tick. Bất kỳ Actor nào vi phạm sẽ phải đối mặt với rủi ro tiêu cực.
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-red-400/50 p-4 bg-red-950/10 border border-red-900/20 rounded-lg">Hiện tại vũ trụ không lưu giữ điều cấm kỵ (Taboo) nào. Các nền văn minh đang ôn hòa.</div>
          )}
        </div>
      </div>
    </div>
  );
}
