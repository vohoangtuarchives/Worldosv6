"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { UniverseHeader } from "@/components/Simulation/UniverseHeader";
import { MetricGrid } from "@/components/Simulation/MetricGrid";
import { AxiomConsole } from "@/components/Simulation/AxiomConsole";
import { SimulationTopology } from "@/components/Simulation/SimulationTopology";
import FactionList from "@/components/Simulation/FactionList";
import GreatFilterAlert from "@/components/Simulation/GreatFilterAlert";
import { SupremeEntityList } from "@/components/Simulation/SupremeEntityList";
import { ConvergenceView } from "@/components/Simulation/ConvergenceView";
import { ArchitectThrone } from "@/components/Simulation/ArchitectThrone";
import { ScenarioSelector } from "@/components/Simulation/ScenarioSelector";
import { AutonomicStatus } from "@/components/Simulation/AutonomicStatus";
import { OmegaVortex } from "@/components/Simulation/OmegaVortex";
import { GraphView } from "@/components/Simulation/GraphView";
import { ActorList } from "@/components/Simulation/ActorList";
import { CivilizationList } from "@/components/Simulation/CivilizationList";
import { CosmicAlertBanner } from "@/components/Simulation/CosmicAlertBanner";
import { AutonomicControl } from "@/components/Simulation/AutonomicControl";
import { OriginDiagnostic } from "@/components/Simulation/OriginDiagnostic";
import { ResonanceMonitor } from "@/components/Simulation/ResonanceMonitor";
import { TimelineComparison } from "@/components/Simulation/TimelineComparison";
import { WarRoom } from "@/components/Simulation/WarRoom";
import { ResonanceWeb } from "@/components/Simulation/ResonanceWeb";
import ObservationMonitor from '@/components/Simulation/ObservationMonitor';
import ConvergenceMonitor from '@/components/Simulation/ConvergenceMonitor';
import IntegrityMonitor from '@/components/Simulation/IntegrityMonitor';
import { UniversalLaw } from "@/components/Simulation/UniversalLaw";
import { VoidArchive } from "@/components/Simulation/VoidArchive";
import { EpochNavigator } from "@/components/Simulation/EpochNavigator";
import { WorldScarsList } from "@/components/Simulation/WorldScarsList";
import { ChronicleTimelineView } from "@/components/Simulation/ChronicleTimelineView";
import { SimulationProvider, useSimulation } from "@/context/SimulationContext";

export default function CosmologicPage() {
  return (
    <SimulationProvider>
      <CosmologicContent />
    </SimulationProvider>
  );
}

function CosmologicContent() {
  const {
    universeId, universe, latestSnapshot, setUniverseId, universes,
    refresh, institutions, actors, chronicles, anomalies, setUniverse,
    error: simError
  } = useSimulation();

  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [mythScars, setMythScars] = useState<{ id: number; name: string; description: string | null }[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);

  // Fallback to first universe if none selected
  useEffect(() => {
    if (!universeId && universes.length > 0) {
      const firstId = universes[0].id;
      setUniverseId(firstId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("universe_id", String(firstId));
      }
    }
  }, [universeId, universes, setUniverseId]);

  const syncUniverseId = useCallback(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("universe_id");
      setUniverseId(stored ? Number(stored) : null);
    }
  }, [setUniverseId]);

  useEffect(() => {
    if (universeId) {
      api.graph(universeId).then(data => {
        setGraphData(data);
      }).catch(console.error);
      api.mythScars(universeId).then(setMythScars).catch(() => setMythScars([]));
    } else {
      setMythScars([]);
    }
  }, [universeId, latestSnapshot?.tick]);

  const handleAdvance = async () => {
    if (!universeId) return;
    setBusy(true);
    try {
      await api.advance(universeId, 1);
      await refresh();
      setMessage({ text: "Tiến trình đã được đẩy nhanh 1 Tick", type: 'info' });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Thất bại", type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleFork = async () => {
    if (!universeId) return;
    setBusy(true);
    try {
      const res = await api.fork(universeId) as { child_universe_id: number };
      window.localStorage.setItem("universe_id", String(res.child_universe_id));
      syncUniverseId();
      setMessage({ text: "Nhánh vũ trụ mới đã được khởi tạo", type: 'info' });
    } catch (e) {
      setMessage({ text: "Fork thất bại", type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handlePulse = async (ticks: number) => {
    if (!universe?.world?.id) return;
    setBusy(true);
    try {
      await api.pulseWorld(universe.world.id, ticks);
      setMessage({ text: `Xung lực (${ticks} ticks) đã được phát phát động`, type: 'info' });
    } catch (e) {
      setMessage({ text: "Pulse thất bại", type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleAutonomic = async () => {
    if (!universe?.world?.id) return;
    setBusy(true);
    try {
      const res = await api.toggleAutonomic(universe.world.id) as { is_autonomic: boolean };
      setUniverse((prev: any) => prev ? { ...prev, world: { ...prev.world!, is_autonomic: res.is_autonomic } } : null);
      setMessage({ text: `Chế độ tự trị: ${res.is_autonomic ? 'BẬT' : 'TẮT'}`, type: 'info' });
    } catch (e) {
      setMessage({ text: "Toggle thất bại", type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateAxioms = async (axioms: Record<string, any>) => {
    if (!universe?.world?.id) return;
    setBusy(true);
    try {
      await api.updateAxioms(universe.world.id, axioms);
      setUniverse((prev: any) => prev ? { ...prev, world: { ...prev.world!, axiom: axioms } } : null);
      setMessage({ text: "Thiên Đạo Tiên Đề đã được cập nhật", type: 'info' });
    } catch (e) {
      setMessage({ text: "Cập nhật thất bại", type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    if (!universe?.world?.id) return;
    setBusy(true);
    try {
      await api.exportWorld(universe.world.id);
      setMessage({ text: "Dữ liệu World đã được xuất thành công", type: 'info' });
    } catch (e) {
      setMessage({ text: "Export thất bại", type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const reader = new FileReader();
      const content = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsText(file);
      });

      const payload = JSON.parse(content);
      await api.importWorld(payload);
      await refresh();
      setMessage({ text: "Dữ liệu World đã được nhập thành công", type: 'info' });
    } catch (e) {
      setMessage({ text: "Import thất bại: Định dạng file không hợp lệ", type: 'error' });
    } finally {
      setBusy(false);
      e.target.value = ""; // Reset input
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'intervention'>('overview');

  if (!universeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 rounded-full border-t-2 border-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-300">Đang chờ kết nối vạn vật...</h2>
        <p className="text-muted-foreground">Vui lòng chọn một Vũ trụ (Universe) từ thanh điều hướng để bắt đầu quan sát.</p>
      </div>
    );
  }

  const activeCrises = universe?.state_vector?.active_crises || {};

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500 relative">
      <GreatFilterAlert universeId={universeId} />
      <CosmicAlertBanner activeCrises={activeCrises} />
      <OmegaVortex reached={universe?.status === 'apotheosis' || universe?.state_vector?.omega_point_reached === true} />

      {/* Header Section */}
      <section className="rounded-xl border border-border bg-card/20 p-4">
        <p className="text-xs text-muted-foreground mb-3">
          Thế giới tự chạy theo xung autonomic. Các nút dưới đây chỉ để thí nghiệm hoặc can thiệp thủ công.
        </p>
        <UniverseHeader
          universe={universe}
          onAdvance={handleAdvance}
          onFork={handleFork}
          onPulse={handlePulse}
          onToggleAutonomic={handleToggleAutonomic}
          onExport={handleExport}
          busy={busy}
        />
      </section>

      <div className="flex items-center justify-end mb-4">
        <label className="cursor-pointer h-9 rounded-md bg-green-600/20 border border-green-500/50 text-green-400 px-4 text-sm font-medium flex items-center hover:bg-green-600/30 transition-all">
          <span>Import World (JSON)</span>
          <input type="file" className="hidden" accept=".json" onChange={handleImport} disabled={busy} />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {/* Message Feedback */}
          {(message || simError) && (
            <div className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${(message?.type === 'error' || simError) ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              }`}>
              <span>{message?.text || simError}</span>
              <button onClick={() => setMessage(null)} className="hover:opacity-70">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-border pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'overview'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
        >
          Quan sát / Dòng thời gian
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'entities'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
        >
          Entities & Simulation
        </button>
        <button
          onClick={() => setActiveTab('intervention')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'intervention'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
        >
          Can thiệp (tùy chọn)
        </button>
      </div>

      {/* Sub-Layout: Overview Segment */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-left-2 fade-in">
          <div className="lg:col-span-3 space-y-6">
            <EpochNavigator universeId={universeId} />
            <MetricGrid snapshot={latestSnapshot} />
            <WorldScarsList
              scars={(() => {
                const vec = universe?.state_vector?.scars;
                const fromVec = Array.isArray(vec) ? vec.map((s: unknown) => typeof s === "string" ? s : (s as { name?: string; description?: string })?.description ?? (s as { name?: string })?.name ?? String(s)) : [];
                const fromDb = mythScars.map(m => m.description || m.name);
                return Array.from(new Set([...fromVec, ...fromDb].filter(Boolean)));
              })()}
            />
            <div className="col-span-4 h-[500px]">
              <SimulationTopology universeId={universeId} />
            </div>
            <div className="col-span-4 h-[500px]">
              <GraphView
                nodes={graphData.nodes || []}
                edges={graphData.edges || []}
              />
            </div>
          </div>
          <div className="lg:col-span-1 border-l border-white/5 pl-4 space-y-6">
            {universe?.world && (
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3 backdrop-blur">
                <h3 className="text-xs font-medium text-muted-foreground mb-1">Trạng thái</h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${universe.world.is_autonomic ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'}`}>
                    Tự tiến hóa: {universe.world.is_autonomic ? 'Bật' : 'Tắt'}
                  </span>
                  {latestSnapshot?.tick != null && (
                    <span className="text-xs text-muted-foreground font-mono">Tick {latestSnapshot.tick}</span>
                  )}
                </div>
              </div>
            )}
            <OriginDiagnostic origin={universe?.world?.origin || 'Default'} />
            <AutonomicControl universeId={universeId} axioms={universe?.world?.axiom || {}} />
            <ObservationMonitor observationLoad={universe?.observation_load || 0} />
            <TimelineComparison universeId={universeId} />
            {universeId && <ChronicleTimelineView universeId={universeId} className="mt-4" />}
          </div>
        </div>
      )}

      {/* Sub-Layout: Entities Segment */}
      {activeTab === 'entities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-2 fade-in">
          <div className="lg:col-span-2 space-y-6">
            <ResonanceWeb universeId={universeId} />
            <SupremeEntityList universeId={universeId} />
            <CivilizationList universeId={universeId} />
            <ActorList universeId={universeId} />
          </div>
          <div className="lg:col-span-1 border-l border-white/5 pl-4 space-y-6">
            <IntegrityMonitor entities={universe?.supreme_entities || []} />
            <FactionList universeId={universeId} />
            <ConvergenceMonitor universeId={universeId} currentTick={latestSnapshot?.tick || 0} />
          </div>
        </div>
      )}

      {/* Sub-Layout: Can thiệp (tùy chọn) */}
      {activeTab === 'intervention' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-left-2 fade-in">
          <p className="lg:col-span-2 text-sm text-muted-foreground">
            Dùng khi muốn thử nghiệm thay đổi axiom hoặc sắc lệnh; không cần cho vận hành bình thường (thế giới tự tiến hóa).
          </p>
          <div className="space-y-6">
            <AxiomConsole
              initialAxioms={universe?.world?.axiom || {}}
              onUpdate={handleUpdateAxioms}
              busy={busy}
            />
            <ScenarioSelector universeId={universeId} />
            <ResonanceMonitor universeId={universeId} />
          </div>
          <div className="space-y-6 border-l border-white/5 pl-4">
            <ArchitectThrone
              universeId={universeId}
              currentTick={latestSnapshot?.tick || 0}
              activeEdicts={latestSnapshot?.metrics?.active_edicts || {}}
            />
            <UniversalLaw universeId={universeId} />
            <VoidArchive universeId={universeId} />
            <WarRoom universeId={universeId} />
            <ConvergenceView universeId={universeId} />
          </div>
        </div>
      )}

    </div>
  );
}
