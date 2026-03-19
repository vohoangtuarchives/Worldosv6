"use client";

import React from "react";
import {
  Users,
  Building2,
  Globe,
  Sparkles,
  ShieldCheck,
  Package,
  Orbit,
  Handshake,
  Library,
  Activity,
  Info,
  type LucideIcon,
} from "lucide-react";
import {
  ActorList,
  FactionList,
  CivilizationList,
  VocationConstellation,
  VocationLibrary,
  SupremeEntityList,
  IntegrityMonitor,
  DiplomacyPanel,
  CulturePanel,
  FinancePanel,
  AttractorMandala,
} from "@/components/Simulation";
import { useSimulation } from "@/context/SimulationContext";

export const PERSONAE_SUB_KEYS = [
  "actors",
  "factions",
  "civilizations",
  "vocation",
  "supreme",
  "integrity",
  "materials",
  "diplomacy",
  "culture",
  "finance",
  "attractors",
] as const;

export type PersonaeSubKey = (typeof PERSONAE_SUB_KEYS)[number];

interface PersonnelHubProps {
  universeId: number;
  activeSubTab: PersonaeSubKey;
  onSubTabChange: (key: PersonaeSubKey) => void;
}

export function PersonnelHub({
  universeId,
  activeSubTab,
  onSubTabChange,
}: PersonnelHubProps) {
  const [vocationView, setVocationView] = React.useState<"catalog" | "constellation">("catalog");
  const {
    actors,
    institutions,
    supremeEntities,
    materials,
    latestSnapshot,
  } = useSimulation();

  const civsCount = (institutions || []).filter(
    (e: any) => e.entity_type === "CIVILIZATION"
  ).length;
  const integrityCount = (supremeEntities || []).filter(
    (e: any) => (e.karma ?? 0) !== 0
  ).length;
  const materialsCount = (materials ?? []).length;
  const activeAttractors =
    (latestSnapshot as any)?.active_attractors ?? [];
  const attractorsCount = activeAttractors.length;

  const diplomacyData = (latestSnapshot as any)?.state_vector?.civilization
    ?.diplomacy ?? { active_treaties: {} };
  let activeTreatiesCount = 0;
  Object.keys(diplomacyData.active_treaties).forEach((src) => {
    Object.keys(diplomacyData.active_treaties[src] || {}).forEach((tgt) => {
      if (parseInt(src) < parseInt(tgt)) activeTreatiesCount++;
    });
  });

  const cultureData =
    (latestSnapshot as any)?.state_vector?.civilization?.culture?.civ_cultures ??
    {};
  let artifactsCount = 0;
  Object.keys(cultureData).forEach((civId) => {
    artifactsCount += cultureData[civId]?.artifacts?.length || 0;
  });

  const subTabs = [
    { key: "actors" as const, label: "Nhân vật", icon: Users, count: (actors ?? []).length },
    { key: "factions" as const, label: "Thể chế", icon: Building2, count: (institutions ?? []).length },
    { key: "civilizations" as const, label: "Văn minh", icon: Globe, count: civsCount },
    { key: "vocation" as const, label: "Thiên Mệnh", icon: Sparkles, count: 0 },
    { key: "supreme" as const, label: "Thực thể Tối cao", icon: Sparkles, count: (supremeEntities ?? []).length },
    { key: "integrity" as const, label: "Nợ nhân quả", icon: ShieldCheck, count: integrityCount },
    { key: "materials" as const, label: "Vật liệu", icon: Package, count: materialsCount },
    { key: "diplomacy" as const, label: "Ngoại Giao", icon: Handshake, count: activeTreatiesCount },
    { key: "culture" as const, label: "Văn Hóa", icon: Library, count: artifactsCount },
    { key: "finance" as const, label: "Kinh Tế", icon: Activity, count: 0 },
    { key: "attractors" as const, label: "Attractors", icon: Orbit, count: attractorsCount },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {subTabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => onSubTabChange(key)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeSubTab === key
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            <span className="text-[10px] font-mono opacity-80">({count})</span>
          </button>
        ))}
      </div>

      <div className="overflow-visible">
        {activeSubTab === "actors" && <ActorList universeId={universeId} />}
        {activeSubTab === "factions" && <FactionList universeId={universeId} />}
        {activeSubTab === "civilizations" && (
          <CivilizationList universeId={universeId} />
        )}
        {activeSubTab === "vocation" && (
          <div className="space-y-6 py-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex p-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setVocationView("catalog")}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    vocationView === "catalog" ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Danh mục (Catalog)
                </button>
                <button 
                  onClick={() => setVocationView("constellation")}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    vocationView === "constellation" ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Chòm sao (Visual)
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                <Info className="w-3 h-3" /> Chế độ tra cứu tích hợp Zenith
              </div>
            </div>

            {vocationView === "catalog" ? (
              <VocationLibrary />
            ) : (
              <VocationConstellation />
            )}
          </div>
        )}
        {activeSubTab === "supreme" && (
          <SupremeEntityList universeId={universeId} />
        )}
        {activeSubTab === "integrity" && (
          <IntegrityMonitor
            entities={(supremeEntities || []).map((e: any) => ({
              id: e.id,
              name: e.name,
              power_level: e.power_level ?? 0,
              karma: e.karma ?? 0,
            }))}
          />
        )}
        {activeSubTab === "materials" && (
          <div className="rounded-lg border border-border/50 bg-card/40 p-6 max-w-md">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Vật liệu
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Số lượng: {materialsCount}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Sử dụng tab "Bản Nguyên" để xem sơ đồ tiến hóa (DAG).
            </p>
          </div>
        )}
        {activeSubTab === "diplomacy" && <DiplomacyPanel universeId={universeId} />}
        {activeSubTab === "culture" && <CulturePanel universeId={universeId} />}
        {activeSubTab === "finance" && <FinancePanel universeId={universeId} />}
        {activeSubTab === "attractors" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 flex flex-col items-center">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Orbit className="w-4 h-4" /> Global Field Topology
                </h3>
                <AttractorMandala
                  fields={(latestSnapshot as any)?.state_vector?.fields ?? {}}
                  size={400}
                />
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-card/30 border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Active Attractors & Strange Loops
                  </h3>
                  <div className="space-y-3">
                    {activeAttractors.length > 0 ? (
                      activeAttractors.map((attr: string) => (
                        <div
                          key={attr}
                          className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-100 capitalize">
                              {attr}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              The system is converging towards this basin.
                            </span>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-pulse" />
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic text-center py-6">
                        No dominant attractors identified. System in primordial chaos.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Stabilizing Forces
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Regime stability is maintained by current Institutional Karma and
                    Historical Scars.
                    {(latestSnapshot as any)?.stability_index < 0.3 &&
                      " WARNING: Instability threshold exceeded."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
