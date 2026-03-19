"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSimulation } from "@/context/SimulationContext";
import { useDashboardStore, type DashboardTab } from "@/store/useDashboardStore";
import {
  UniverseHeader,
  MetricGrid,
  EventFeed,
  CausalTopologyGraph,
  MaterialEvolutionDAG,
  ChronicleTimelineView,
  VoidArchive,
  AttractorMandala,
  CognitiveGraph,
  SocialIntegrityGraph,
} from "@/components/Simulation";
import {
  Activity,
  Network,
  AlertTriangle,
  Users,
  Orbit,
  Brain,
  Workflow,
  History,
  Shield,
  Scroll,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CivilizationReview } from "./CivilizationReview";
import { api } from "@/lib/api";
import { BiologyMetricsPanel } from "./BiologyMetricsPanel";
import { SocietyMetricsPanel } from "./SocietyMetricsPanel";
import { HistoryTimelinePanel } from "./HistoryTimelinePanel";
import { EcologyPanel } from "./EcologyPanel";
import { NavigatorPanel } from "./NavigatorPanel";
import { IdeologyPanel } from "./IdeologyPanel";
import { MultiverseExplorer } from "../Simulation/MultiverseExplorer";
import { TopMetricBar } from "./TopMetricBar";
import { ApexObserverTab } from "./zenith/ApexObserverTab";
import { AttractorSidebarPanel } from "./AttractorSidebarPanel";
import { ConvergenceMapPanel } from "@/components/features/cosmos/ConvergenceMapPanel";
import { PersonnelHub, type PersonaeSubKey, PERSONAE_SUB_KEYS } from "./PersonnelHub";

/** Engine / nguồn liên quan tới từng loại thực thể (theo backend/docs/ENGINE_PRODUCTS.md). */
const PERSONAE_ENGINE_HINT: Record<PersonaeSubKey, string> = {
  actors: "Intelligence: GetUniverseActorsAction, ActorBehaviorEngine, ActorEvolutionService",
  factions: "ReligionEngine, GovernanceEngine, CivilizationFormationEngine, LawEvolutionEngine",
  civilizations: "CivilizationFormationEngine, ZoneConflictEngine, GreatFilterEngine",
  vocation: "VocationRegistry, RuleSetCombinator, AxiomRegistry",
  supreme: "AscensionEngine, GreatPersonEngine",
  integrity: "SupremeEntity.karma (cùng nguồn Thực thể Tối cao)",
  materials: "ScenarioEngine, Material DAG, evolution pipeline",
  diplomacy: "DiplomacyEngine, Faction Tension, active_treaties in State Vector",
  culture: "CultureEngine, ArtifactVault, TabooList, Civ Culture State",
  finance: "FinanceEngine, ProductionChainEngine, Global Economy Loop",
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
    universes,
    refresh,
    loading: isProcessing,
    error: simError,
  } = useSimulation();

  const {
    activeTab,
    setActiveTab,
    showRightPanel,
    toggleRightPanel,
    noise,
    setNoise,
    clarity,
    setClarity,
  } = useDashboardStore();

  const [personaeSubTab, setPersonaeSubTabState] = useState<PersonaeSubKey>("actors");
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

  const isVoid = noise > 0.8;
  useEffect(() => {
    api
      .worldosEngines()
      .then((res: any) => setProductToEngines(res.product_to_engines ?? null))
      .catch(() => setProductToEngines(null));
  }, [activeTab]);

  const handleAdvance = async () => {
    if (!universeId) return;
    try {
      await api.advance(universeId, 1);
      await refresh();
    } catch (e) {
      console.error("Failed to advance:", e);
    }
  };

  const handleFork = async () => {
    if (!universeId || !universe) return;
    try {
      const tick = universe.current_tick ?? latestSnapshot?.tick ?? 0;
      const res = await api.fork(universeId, tick) as any;
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
      await api.advance(universeId, ticks);
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
            <TabButton active={activeTab === "topology"} onClick={() => setActiveTab("topology")} icon={Orbit} label="Đa Vũ Trụ" />
            <TabButton active={activeTab === "causality"} onClick={() => setActiveTab("causality")} icon={Network} label="Nhân Quả" />
            <TabButton active={activeTab === "cognitive"} onClick={() => setActiveTab("cognitive")} icon={Brain} label="Ý Thức" />
            <TabButton active={activeTab === "evolution"} onClick={() => setActiveTab("evolution")} icon={Workflow} label="Bản Nguyên" />
            <TabButton active={activeTab === "actors"} onClick={() => setActiveTab("actors")} icon={Users} label="Nhân Sự" />
            <TabButton active={activeTab === "chronicles"} onClick={() => setActiveTab("chronicles")} icon={History} label="Biên Niên Sử" />
            <TabButton active={activeTab === "narrative"} onClick={() => setActiveTab("narrative")} icon={Scroll} label="Sử Thi" />
            <TabButton active={activeTab === "apex"} onClick={() => setActiveTab("apex")} icon={Shield} label="Zenith Apex" />
            <div className="ml-auto flex items-center gap-2">
               <button onClick={toggleRightPanel} className={`p-2 rounded-md transition-all ${showRightPanel ? "bg-blue-500/20 text-blue-300" : "text-muted-foreground hover:bg-muted/40"}`}>
                 <Activity className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="flex-1 relative z-0 min-h-0 overflow-y-auto transition-all duration-300">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex-1 min-h-full ${noise > 0.5 ? "animate-pulse" : ""} ${isVoid ? "blur-[1px] skew-x-1 brightness-[1.1]" : ""}`}
              >
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
              {activeTab === "actors" && universeId && (
                <div className="flex flex-col p-6">
                  <PersonnelHub 
                    universeId={universeId} 
                    activeSubTab={personaeSubTab} 
                    onSubTabChange={setPersonaeSubTab} 
                  />
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
                {activeTab === "multiverse" && (
                  <div className="p-6 space-y-6">
                    <MultiverseExplorer />
                    {universeId && <ConvergenceMapPanel universeId={universeId} />}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showRightPanel && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-80 flex-none bg-card/30 backdrop-blur-2xl border-l border-white/5 flex flex-col overflow-y-auto relative z-40"
            >
               <div className="p-6 space-y-8">
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
            </motion.aside>
          )}
        </AnimatePresence>
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
      <span className="relative z-10 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </span>
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
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
