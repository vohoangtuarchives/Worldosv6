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
  ChronicleView,
  ActorList,
  FactionList,
  CivilizationList,
  SupremeEntityList,
  IntegrityMonitor,
  VoidArchive,
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
  Library,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Package,
  Orbit,
} from "lucide-react";
import { api } from "@/lib/api";
import { BiologyMetricsPanel } from "./BiologyMetricsPanel";
import { SocietyMetricsPanel } from "./SocietyMetricsPanel";
import { HistoryTimelinePanel } from "./HistoryTimelinePanel";
import { EnvironmentPanel } from "./EnvironmentPanel";
import { NavigatorPanel } from "./NavigatorPanel";
import { IdeologyPanel } from "./IdeologyPanel";

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
    | "evolution"
    | "chronicles"
    | "actors"
    | "archive"
    | "chronicle-detail"
  >("topology");
  const [personaeSubTab, setPersonaeSubTabState] = useState<PersonaeSubKey>("actors");
  const [showRightPanel, setShowRightPanel] = useState(true);
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
    if (activeTab !== "actors") return;
    api
      .worldosEngines()
      .then((res) => setProductToEngines(res.product_to_engines ?? null))
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
    <div className={`flex flex-col bg-background text-foreground overflow-hidden font-sans relative rounded-lg border border-border ${embedded ? "min-h-[calc(100vh-8rem)]" : "h-screen"}`}>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background opacity-80" />
        <Starfield />
      </div>

      <header className="flex-none p-4 border-b border-border/50 bg-card/30 backdrop-blur-md z-10 relative">
        <div className="relative z-10">
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
              <li><strong className="text-slate-300">Chronicles / Dư Âm</strong> — Xem lịch sử và biên niên sử của vũ trụ này.</li>
              <li>Chọn <strong className="text-slate-300">universe khác</strong> trong cùng world (nếu có) từ danh sách bên trái hoặc màn hình world.</li>
            </ul>
          </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden z-10 relative min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-card/20 relative backdrop-blur-[2px]">
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="flex items-center gap-1 p-2 border-b border-border/50 bg-card/40 backdrop-blur-sm z-10 flex-wrap">
            <TabButton
              active={activeTab === "topology"}
              onClick={() => setActiveTab("topology")}
              icon={<Network className="w-4 h-4" />}
              label="Topology nhân quả"
            />
            <TabButton
              active={activeTab === "evolution"}
              onClick={() => setActiveTab("evolution")}
              icon={<Layers className="w-4 h-4" />}
              label="Material Evolution"
            />
            <TabButton
              active={activeTab === "chronicles"}
              onClick={() => setActiveTab("chronicles")}
              icon={<ScrollText className="w-4 h-4" />}
              label="Chronicles"
            />
            <TabButton
              active={activeTab === "chronicle-detail"}
              onClick={() => setActiveTab("chronicle-detail")}
              icon={<BookOpen className="w-4 h-4" />}
              label="Biên Niên Sử"
            />
            <TabButton
              active={activeTab === "actors"}
              onClick={() => setActiveTab("actors")}
              icon={<Users className="w-4 h-4" />}
              label="Thực thể"
            />
            <TabButton
              active={activeTab === "archive"}
              onClick={() => setActiveTab("archive")}
              icon={<Library className="w-4 h-4" />}
              label="Dư Âm"
            />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-2 px-3 py-1 bg-card/50 rounded-full border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tick:{" "}
                <span className="text-emerald-400 font-bold">
                  {latestSnapshot?.tick || 0}
                </span>
              </span>
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className={`p-1.5 rounded hover:bg-muted/50 transition-colors ${showRightPanel ? "text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "text-muted-foreground"}`}
                title="Bật/tắt bảng chi tiết"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden z-0 min-h-0">
            {activeTab === "topology" && universeId && (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <CausalTopologyGraph universeId={universeId} />
              </div>
            )}
            {activeTab === "evolution" && universeId && (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <MaterialEvolutionDAG universeId={universeId} />
              </div>
            )}
            {activeTab === "chronicles" && universeId && (
              <div className="absolute inset-0 p-4 overflow-auto animate-in fade-in duration-500">
                <ChronicleTimelineView universeId={universeId} />
              </div>
            )}
            {activeTab === "actors" && universeId && (
              <div className="absolute inset-0 flex flex-col animate-in fade-in duration-500">
                <div className="flex-none flex items-center gap-1 p-2 border-b border-border/50 bg-card/30 flex-wrap">
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
                <div className="flex-none px-2 pb-2 border-b border-border/30">
                  <p className="text-[10px] text-muted-foreground font-mono truncate" title={engineHintText}>
                    Engine liên quan: {engineHintText}
                  </p>
                </div>
                <div className="flex-1 min-h-0 overflow-auto p-4">
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
                        Vật liệu (Material instances)
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Số lượng: <span className="font-mono font-medium text-foreground">{materialsCount}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("evolution")}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        Xem DAG
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">Mở tab Material Evolution để xem đồ thị vật liệu.</p>
                    </div>
                  )}
                  {personaeSubTab === "attractors" && (
                    <div className="rounded-lg border border-border/50 bg-card/40 p-6 max-w-md">
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Orbit className="w-4 h-4 text-muted-foreground" />
                        Attractors (từ snapshot)
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Attractor lộ ra từ dữ liệu snapshot hiện tại. Số lượng: <span className="font-mono font-medium text-foreground">{attractorsCount}</span>
                      </p>
                      {activeAttractors.length > 0 ? (
                        <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                          {activeAttractors.map((a, i) => (
                            <li key={i} className="font-mono text-foreground/90">{a}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Chưa có active attractors trong snapshot này.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "archive" && universeId && (
              <div className="absolute inset-0 p-4 overflow-auto animate-in fade-in duration-500">
                <VoidArchive universeId={universeId} />
              </div>
            )}
            {activeTab === "chronicle-detail" && universeId && (
              <div className="absolute inset-0 overflow-auto animate-in fade-in duration-500 h-full">
                <ChronicleView universeId={universeId} />
              </div>
            )}
          </div>
        </div>

        {showRightPanel && (
          <aside className="w-80 flex-none border-l border-border/50 bg-card/60 backdrop-blur-xl flex flex-col h-full transition-all duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
            <div className="flex-none p-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-[10px]">
                <Activity className="w-3 h-3" /> Chỉ số hệ thống
              </h3>
              <div className="space-y-4">
                <MetricGrid
                  snapshot={latestSnapshot}
                  className="grid grid-cols-1 gap-3"
                />
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <NavigatorPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <IdeologyPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <BiologyMetricsPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <SocietyMetricsPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <EnvironmentPanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <HistoryTimelinePanel universeId={universeId ?? null} refreshTrigger={latestSnapshot?.tick ?? universe?.current_tick ?? 0} />
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="p-3 bg-card/30 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="w-3 h-3" /> Bất thường
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded animate-pulse">
                  Live
                </span>
              </div>
              <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <EventFeed universeId={universeId} />
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
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
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
        {icon}
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
