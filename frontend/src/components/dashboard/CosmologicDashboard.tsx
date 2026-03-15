"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSimulation } from "@/context/SimulationContext";
import {
  UniverseHeader,
  MetricGrid,
  EventFeed,
  CausalTopologyGraph,
  MaterialEvolutionDAG,
  ChronicleTimelineView,
  ActorList,
  FactionList,
  CivilizationList,
  SupremeEntityList,
  IntegrityMonitor,
  VoidArchive,
  AttractorMandala,
  CognitiveGraph,
  SocialIntegrityGraph,
} from "@/components/Simulation";
import {
  Activity,
  Network,
  Layers,
  ScrollText,
  Info,
  AlertTriangle,
  Users,
  Building2,
  Globe,
  Sparkles,
  ShieldCheck,
  Package,
  Orbit,
  Eye,
  Library,
  Repeat,
  Brain,
  Workflow,
  History,
  Shield,
  Atom,
  Layout,
  ChevronRight,
  ArrowRight,
  FileText,
  Search,
  Database,
  Scroll,
  type LucideIcon,
} from "lucide-react";
import { CivilizationReview } from "./CivilizationReview";
import { api } from "@/lib/api";
import { BiologyMetricsPanel } from "./BiologyMetricsPanel";
import { SocietyMetricsPanel } from "./SocietyMetricsPanel";
import { HistoryTimelinePanel } from "./HistoryTimelinePanel";
import { EcologyPanel } from "./EcologyPanel";
import { NavigatorPanel } from "./NavigatorPanel";
import { IdeologyPanel } from "./IdeologyPanel";
import { ApexControlPanel } from "./ApexControlPanel";
import { MultiverseExplorer } from "../Simulation/MultiverseExplorer";
import { TopMetricBar } from "./TopMetricBar";
import { ApexObserverTab } from "./zenith/ApexObserverTab";
import { AttractorSidebarPanel } from "./AttractorSidebarPanel";

const PERSONAE_SUB_KEYS = ["actors", "factions", "civilizations", "supreme", "integrity", "materials", "attractors"] as const;
type PersonaeSubKey = (typeof PERSONAE_SUB_KEYS)[number];

/** Engine / nguồn liên quan tới từng loại thực thể (theo backend/docs/ENGINE_PRODUCTS.md). */
const PERSONAE_ENGINE_HINT: Record<PersonaeSubKey, string> = {
  actors: "Intelligence: GetUniverseActorsAction, ActorBehaviorEngine, ActorEvolutionService",
  factions: "ReligionEngine, GovernanceEngine, CivilizationFormationEngine, LawEvolutionEngine",
  civilizations: "CivilizationFormationEngine, ZoneConflictEngine, GreatFilterEngine",
  supreme: "AscensionEngine, GreatPersonEngine",
  integrity: "SupremeEntity.karma (cùng nguồn Thực thể Tối cao)",
  materials: "ScenarioEngine, Material DAG, evolution pipeline",
  attractors: "DynamicAttractorEngine, CivilizationCollapseEngine, snapshot active_attractors",
};

export function CosmologicDashboard({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    universeId,
    universe,
    latestSnapshot,
    setUniverseId,
    setLatestSnapshot,
    universes,
    refresh,
    loading: isProcessing,
    error: simError,
    actors,
    institutions,
    supremeEntities,
    materials,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<
    | "topology"
    | "causality"
    | "cognitive"
    | "evolution"
    | "chronicles"
    | "actors"
    | "archive"
    | "apex"
    | "multiverse"
    | "narrative"
  >("topology");
  const [personaeSubTab, setPersonaeSubTabState] = useState<PersonaeSubKey>("actors");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [noise, setNoise] = useState(0);
  const [clarity, setClarity] = useState("Canonical");
  const [productToEngines, setProductToEngines] = useState<Record<string, string[]> | null>(null);

  const setPersonaeSubTab = useCallback(
    (key: PersonaeSubKey) => {
      setPersonaeSubTabState(key);
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("personae", key);
      router.replace(`${pathname ?? ""}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const civsCount = (institutions || []).filter((e: { entity_type?: string }) => e.entity_type === "CIVILIZATION").length;
  const integrityCount = (supremeEntities || []).filter((e: { karma?: number }) => (e.karma ?? 0) !== 0).length;
  const materialsCount = (materials ?? []).length;
  const activeAttractors = (latestSnapshot as { active_attractors?: string[] } | null)?.active_attractors ?? [];
  const attractorsCount = activeAttractors.length;

  useEffect(() => {
    if (!universeId && universes.length > 0) {
      setUniverseId(universes[0].id);
    }
  }, [universeId, universes, setUniverseId]);

  useEffect(() => {
    const p = searchParams?.get("personae");
    if (p && PERSONAE_SUB_KEYS.includes(p as PersonaeSubKey)) {
      setPersonaeSubTabState(p as PersonaeSubKey);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "actors" && pathname) {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("personae", personaeSubTab);
      const qs = next.toString();
      const want = `${pathname}${qs ? `?${qs}` : ""}`;
      if (typeof window !== "undefined" && window.location.pathname === pathname && `${pathname}${window.location.search}` !== want) {
        router.replace(want, { scroll: false });
      }
    }
  }, [activeTab, personaeSubTab, pathname, searchParams, router]);

  useEffect(() => {
    if (!universeId) return;
    api.labDashboard.state(universeId)
      .then((data: any) => {
        setNoise(data.noise ?? 0);
        setClarity(data.clarity ?? "Canonical");
      })
      .catch(err => console.error("Failed to fetch noise level", err));
  }, [universeId, latestSnapshot?.tick]);

  const glitchChance = noise > 0.5 ? (noise - 0.5) * 2 : 0;
  const isVoid = noise > 0.8;
  useEffect(() => {
    api
      .worldosEngines()
      .then((res: any) => setProductToEngines(res.product_to_engines ?? null))
      .catch(() => setProductToEngines(null));
  }, [activeTab]);

  const engines = productToEngines?.[personaeSubTab];
  const engineHintText =
    engines && engines.length > 0 ? engines.join(", ") : PERSONAE_ENGINE_HINT[personaeSubTab];

  const handleAdvance = async () => {
    if (!universeId) return;
    try {
      const res = await api.advance(universeId, 1) as { ok?: boolean; snapshot?: { tick?: number; entropy?: number; stability_index?: number; metrics?: unknown } };
      const snap = res?.ok ? res.snapshot : undefined;
      if (snap && snap.tick != null) {
        setLatestSnapshot((prev: { tick?: number; entropy?: number; stability_index?: number; metrics?: unknown } | null) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          tick: snap.tick,
          entropy: snap.entropy ?? (prev && typeof prev === "object" ? prev.entropy : undefined),
          stability_index: snap.stability_index ?? (prev && typeof prev === "object" ? prev.stability_index : undefined),
          metrics: snap.metrics ?? (prev && typeof prev === "object" ? prev.metrics : {}) ?? {},
        }));
      }
      await refresh();
    } catch (e) {
      console.error("Failed to advance:", e);
    }
  };

  const handleFork = async () => {
    if (!universeId || !universe) return;
    try {
      const tick = universe.current_tick ?? latestSnapshot?.tick ?? 0;
      const res = await api.fork(universeId, tick) as { ok?: boolean; child_universe_id?: number };
      if (res?.ok && res.child_universe_id) {
        await refresh();
        setUniverseId(res.child_universe_id);
      }
    } catch (e) {
      console.error("Fork failed:", e);
    }
  };

  const handlePulse = async (ticks: number) => {
    if (!universeId) return;
    try {
      const res = await api.advance(universeId, ticks) as { ok?: boolean; snapshot?: { tick?: number; entropy?: number; stability_index?: number; metrics?: unknown } };
      const snap = res?.ok ? res.snapshot : undefined;
      if (snap && snap.tick != null) {
        setLatestSnapshot((prev: { tick?: number; entropy?: number; stability_index?: number; metrics?: unknown } | null) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          tick: snap.tick,
          entropy: snap.entropy ?? (prev && typeof prev === "object" ? prev.entropy : undefined),
          stability_index: snap.stability_index ?? (prev && typeof prev === "object" ? prev.stability_index : undefined),
          metrics: snap.metrics ?? (prev && typeof prev === "object" ? prev.metrics : {}) ?? {},
        }));
      }
      await refresh();
    } catch (e) {
      console.error(`Failed to pulse ${ticks} ticks:`, e);
    }
  };

  const handleToggleAutonomic = async () => {
    if (!universe?.world?.id) return;
    try {
      await api.toggleAutonomic(universe.world.id);
      await refresh();
    } catch (e) {
      console.error("Failed to toggle autonomic:", e);
    }
  };

  return (
    <div className={`flex flex-col bg-background text-foreground font-sans relative rounded-lg border border-border ${embedded ? "min-h-[calc(100vh-8rem)]" : "min-h-screen"}`}>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background opacity-80" />
        <Starfield />
      </div>

      <header className={`flex-none p-4 border-b border-border/50 bg-card/30 backdrop-blur-md z-30 relative transition-all duration-700 ${noise > 0.4 ? "grayscale-[0.4]" : ""}`}>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
              <Activity className="w-3 h-3" /> Chỉ số hệ thống
            </h3>
            {noise > 0.2 && (
              <div className="flex items-center gap-2 animate-pulse">
                <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-tighter">Epistemic Drift Detected:</span>
                <span className="text-[10px] font-mono text-muted-foreground">{clarity}</span>
              </div>
            )}
          </div>
          <UniverseHeader
            universe={universe}
            universeId={universeId}
            onAdvance={handleAdvance}
            onFork={handleFork}
            onPulse={handlePulse}
            onToggleAutonomic={handleToggleAutonomic}
            busy={isProcessing}
          />
        </div>
        {simError && (
          <div className="mt-2 p-2 bg-destructive/20 border border-destructive/50 text-destructive text-sm rounded flex items-center gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{simError}</span>
          </div>
        )}
        {universe?.status === "archived" && (
          <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-sm">
            <p className="font-medium text-amber-400/90 mb-1.5">Universe đã archived</p>
            <p className="text-muted-foreground text-xs mb-2">Vũ trụ này không còn được pulse tự động. Bạn có thể:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong className="text-purple-400/90">Fork Universe</strong> — Tạo nhánh mới từ tick hiện tại, sau đó dashboard sẽ chuyển sang universe con (active).</li>
              <li><strong className="text-slate-300">Tick +1</strong> — Advance thủ công nếu muốn cập nhật số liệu (Pulse world không chạy universe archived).</li>
              <li><strong className="text-slate-300">Biên Niên Sử / Dư Âm</strong> — Xem lịch sử và biên niên sử của vũ trụ này.</li>
              <li>Chọn <strong className="text-slate-300">universe khác</strong> trong cùng world (nếu có) từ danh sách bên trái hoặc màn hình world.</li>
            </ul>
          </div>
        )}
      </header>

      <main className={`flex-1 flex z-10 relative min-h-0 bg-background/20 overflow-visible transition-all duration-1000 ${noise > 0.6 ? "sepia-[0.1]" : ""}`}>
        <div className="flex-1 flex flex-col min-w-0 bg-card/5 relative backdrop-blur-[1px] overflow-visible">
          <div
            className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="z-20 sticky top-0">
            <TopMetricBar />
          </div>

          <div className="flex items-center gap-1 p-2 border-b border-border/30 bg-card/20 backdrop-blur-md z-20 flex-wrap sticky top-[64px]">
            {/* Same TabButtons as before */}
            <TabButton active={activeTab === "topology"} onClick={() => setActiveTab("topology")} icon={Orbit} label="Đa Vũ Trụ" />
            <TabButton active={activeTab === "causality"} onClick={() => setActiveTab("causality")} icon={Network} label="Nhân Quả" />
            <TabButton active={activeTab === "cognitive"} onClick={() => setActiveTab("cognitive")} icon={Brain} label="Ý Thức" />
            <TabButton active={activeTab === "evolution"} onClick={() => setActiveTab("evolution")} icon={Workflow} label="Bản Nguyên" />
            <TabButton active={activeTab === "actors"} onClick={() => setActiveTab("actors")} icon={Users} label="Nhân Sự" />
            <TabButton active={activeTab === "chronicles"} onClick={() => setActiveTab("chronicles")} icon={History} label="Biên Niên Sử" />
            <TabButton active={activeTab === "narrative"} onClick={() => setActiveTab("narrative")} icon={Scroll} label="Sử Thi" />
            <TabButton active={activeTab === "apex"} onClick={() => setActiveTab("apex")} icon={Shield} label="Zenith Apex" />
            <div className="ml-auto flex items-center gap-2">
               <button onClick={() => setShowRightPanel(!showRightPanel)} className={`p-2 rounded-md transition-all ${showRightPanel ? "bg-blue-500/20 text-blue-300" : "text-muted-foreground hover:bg-muted/40"}`}>
                 <Activity className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className={`flex-1 relative z-0 min-h-0 overflow-visible transition-all duration-300 ${noise > 0.5 ? "animate-pulse" : ""} ${isVoid ? "blur-[1px] skew-x-1 brightness-[1.1]" : ""}`}>
            <div className="animate-in fade-in duration-700">
                {activeTab === "topology" && universeId && (
                <div className="flex flex-col gap-6 p-6">
                  <CausalTopologyGraph universeId={universeId as number} />
                  {latestSnapshot?.state_vector?.fields && (
                    <div className="p-8 bg-card/20 backdrop-blur-md rounded-3xl border border-white/5 flex justify-center">
                       <AttractorMandala fields={latestSnapshot.state_vector.fields} size={320} />
                    </div>
                  )}
                </div>
              )}
              {activeTab === "causality" && universeId && (
                <div className="p-6 h-[650px]">
                  <SocialIntegrityGraph universeId={universeId as number} />
                </div>
              )}
              {activeTab === "cognitive" && universeId && (
                <div className="p-6"> <CognitiveGraph universeId={universeId} ideas={latestSnapshot?.metrics?.ideas ?? []} schools={latestSnapshot?.metrics?.schools ?? []} /> </div>
              )}
              {activeTab === "evolution" && universeId && (
                <div className="p-6"> <MaterialEvolutionDAG universeId={universeId} /> </div>
              )}
              {activeTab === "chronicles" && universeId && (
                <div className="p-6"> <ChronicleTimelineView universeId={universeId} /> </div>
              )}
              {activeTab === "actors" && universeId && (
                <div className="flex flex-col p-6">
                  <div className="flex items-center gap-1 mb-4 flex-wrap">
                    {(
                      [
                        { key: "actors" as const, label: "Nhân vật", icon: Users, count: (actors ?? []).length },
                        { key: "factions" as const, label: "Thể chế", icon: Building2, count: (institutions ?? []).length },
                        { key: "civilizations" as const, label: "Văn minh", icon: Globe, count: civsCount },
                        { key: "supreme" as const, label: "Thực thể Tối cao", icon: Sparkles, count: (supremeEntities ?? []).length },
                        { key: "integrity" as const, label: "Nợ nhân quả", icon: ShieldCheck, count: integrityCount },
                        { key: "materials" as const, label: "Vật liệu", icon: Package, count: materialsCount },
                        { key: "attractors" as const, label: "Attractors", icon: Orbit, count: attractorsCount },
                      ] as const
                    ).map(({ key, label, icon: Icon, count }) => (
                      <button
                        key={key}
                        onClick={() => setPersonaeSubTab(key)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          personaeSubTab === key
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
                    {personaeSubTab === "actors" && <ActorList universeId={universeId} />}
                    {personaeSubTab === "factions" && <FactionList universeId={universeId} />}
                    {personaeSubTab === "civilizations" && <CivilizationList universeId={universeId} />}
                    {personaeSubTab === "supreme" && <SupremeEntityList universeId={universeId} />}
                    {personaeSubTab === "integrity" && (
                      <IntegrityMonitor
                        entities={(supremeEntities || []).map((e: { id: number; name: string; power_level?: number; karma?: number }) => ({
                          id: e.id,
                          name: e.name,
                          power_level: e.power_level ?? 0,
                          karma: e.karma ?? 0,
                        }))}
                      />
                    )}
                    {personaeSubTab === "materials" && (
                       <div className="rounded-lg border border-border/50 bg-card/40 p-6 max-w-md">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          Vật liệu
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">Số lượng: {materialsCount}</p>
                        <button onClick={() => setActiveTab("evolution")} className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-md text-xs font-bold uppercase transition-all hover:bg-blue-500/30">Xem DAG</button>
                       </div>
                    )}
                    {personaeSubTab === "attractors" && universeId && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="p-8 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 flex flex-col items-center">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Orbit className="w-4 h-4" /> Global Field Topology
                            </h3>
                            <AttractorMandala fields={latestSnapshot?.state_vector?.fields ?? {}} size={400} />
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
                                    <div key={attr} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-blue-100 capitalize">{attr}</span>
                                        <span className="text-[10px] text-muted-foreground">The system is converging towards this basin.</span>
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
                                    <Shield className="w-4 h-4" /> Stabilizing Forces
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Regime stability is maintained by current Institutional Karma and Historical Scars. 
                                    { (latestSnapshot?.stability_index ?? 0) < 0.3 && " WARNING: Instability threshold exceeded." }
                                </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "chronicles" && universeId && (
                <div className="p-6"> <ChronicleTimelineView universeId={universeId} /> </div>
              )}
              {activeTab === "narrative" && universeId && (
                <div className="p-6"> <CivilizationReview universeId={universeId as number} /> </div>
              )}
              {activeTab === "archive" && universeId && ( <div className="p-6"> <VoidArchive universeId={universeId} /> </div> )}
              {activeTab === "apex" && universeId && ( <div className=""> <ApexObserverTab universeId={universeId} /> </div> )}
              {activeTab === "multiverse" && ( <div className="p-6"> <MultiverseExplorer /> </div> )}
            </div>
          </div>
        </div>

        {showRightPanel && (
          <aside className="w-80 flex-none bg-card/30 backdrop-blur-2xl border-l border-white/5 flex flex-col overflow-visible animate-in slide-in-from-right-2 duration-300 relative">
             <div className="sticky top-0 p-6 space-y-8 overflow-visible">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full backdrop-blur-md z-30">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Observer HUD</span>
                </div>
                
                <div className="space-y-8">
                  <AttractorSidebarPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <NavigatorPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <IdeologyPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <BiologyMetricsPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <SocietyMetricsPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <EcologyPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <HistoryTimelinePanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
                  <div className="pt-4 border-t border-white/5">
                    <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-3 h-3" /> Bất thường
                 </h3>
                    <EventFeed universeId={universeId} />
                  </div>
                </div>
             </div>
          </aside>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 relative overflow-hidden group
        ${active
          ? "text-blue-300 bg-blue-500/10 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
        }
      `}
    >
      {active && (
        <div className="absolute inset-0 bg-blue-400/5 animate-pulse" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </span>
      {active && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
      )}
    </button>
  );
}

function Starfield() {
  return (
    <div className="absolute inset-0 z-0">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-900/10 rounded-full blur-[80px] animate-pulse"
        style={{ animationDuration: "10s", animationDelay: "1s" }}
      />
    </div>
  );
}
