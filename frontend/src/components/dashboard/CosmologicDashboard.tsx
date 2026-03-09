"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { api } from "@/lib/api";
import { BiologyMetricsPanel } from "./BiologyMetricsPanel";
import { SocietyMetricsPanel } from "./SocietyMetricsPanel";
import { HistoryTimelinePanel } from "./HistoryTimelinePanel";
import { EnvironmentPanel } from "./EnvironmentPanel";
import { NavigatorPanel } from "./NavigatorPanel";
import { IdeologyPanel } from "./IdeologyPanel";

export function CosmologicDashboard({ embedded = false }: { embedded?: boolean }) {
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
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<
    | "topology"
    | "evolution"
    | "chronicles"
    | "actors"
    | "factions"
    | "civilizations"
    | "archive"
    | "chronicle-detail"
  >("topology");
  const [showRightPanel, setShowRightPanel] = useState(true);

  useEffect(() => {
    if (!universeId && universes.length > 0) {
      setUniverseId(universes[0].id);
    }
  }, [universeId, universes, setUniverseId]);

  const handleAdvance = async () => {
    if (!universeId) return;
    try {
      const res = await api.advance(universeId, 1) as { ok?: boolean; snapshot?: { tick?: number; entropy?: number; stability_index?: number; metrics?: unknown } };
      if (res?.ok && res.snapshot?.tick != null) {
        setLatestSnapshot(prev => ({
          ...prev,
          tick: res.snapshot!.tick,
          entropy: res.snapshot?.entropy ?? prev?.entropy,
          stability_index: res.snapshot?.stability_index ?? prev?.stability_index,
          metrics: res.snapshot?.metrics ?? prev?.metrics ?? {},
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
      if (res?.ok && res.snapshot?.tick != null) {
        setLatestSnapshot(prev => ({
          ...prev,
          tick: res.snapshot!.tick,
          entropy: res.snapshot?.entropy ?? prev?.entropy,
          stability_index: res.snapshot?.stability_index ?? prev?.stability_index,
          metrics: res.snapshot?.metrics ?? prev?.metrics ?? {},
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
          <p className="mt-2 text-[10px] text-muted-foreground">
            Universe đang <span className="text-amber-400/80">archived</span> — vẫn có thể dùng Advance/Pulse để cập nhật số liệu; Fork tạo nhánh mới từ tick hiện tại.
          </p>
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
              active={activeTab === "factions"}
              onClick={() => setActiveTab("factions")}
              icon={<Building2 className="w-4 h-4" />}
              label="Thể chế"
            />
            <TabButton
              active={activeTab === "civilizations"}
              onClick={() => setActiveTab("civilizations")}
              icon={<Globe className="w-4 h-4" />}
              label="Văn minh"
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
              <div className="absolute inset-0 p-4 animate-in fade-in duration-500">
                <ActorList universeId={universeId} />
              </div>
            )}
            {activeTab === "factions" && universeId && (
              <div className="absolute inset-0 p-4 overflow-auto animate-in fade-in duration-500">
                <FactionList universeId={universeId} />
              </div>
            )}
            {activeTab === "civilizations" && universeId && (
              <div className="absolute inset-0 p-4 overflow-auto animate-in fade-in duration-500">
                <CivilizationList universeId={universeId} />
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
