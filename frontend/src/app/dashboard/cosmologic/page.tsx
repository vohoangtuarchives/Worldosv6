"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useWorldStream } from "@/hooks/useWorldStream";
import { UniverseHeader } from "@/components/Simulation/UniverseHeader";
import { MetricGrid } from "@/components/Simulation/MetricGrid";
import { AxiomConsole } from "@/components/Simulation/AxiomConsole";
import { SimulationTopology } from "@/components/Simulation/SimulationTopology";
import { EventFeed } from "@/components/Simulation/EventFeed";
import FactionList from "@/components/Simulation/FactionList";
import { ChronicleView } from "@/components/Simulation/ChronicleView";
import MaterialSystemView from "@/components/Simulation/MaterialSystemView";
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
// import EvolutionView - Removed as it does not exist in the current codebase



export default function CosmologicPage() {
  const [universeId, setUniverseId] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);

  // Sync universeId from localStorage (UniverseSelector sets it)
  const syncUniverseId = useCallback(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("universe_id");
      setUniverseId(stored ? Number(stored) : null);
    }
  }, []);

  useEffect(() => {
    syncUniverseId();
    window.addEventListener("storage", syncUniverseId);
    // Intersection observer or other tricks can be used if UniverseSelector 
    // doesn't trigger 'storage' on the same tab.
    const interval = setInterval(syncUniverseId, 1000);

    return () => {
      window.removeEventListener("storage", syncUniverseId);
      clearInterval(interval);
    };
  }, [syncUniverseId]);

  const { universe, latestSnapshot, setUniverse, refresh } = useWorldStream(universeId);

  useEffect(() => {
    if (universeId) {
      api.graph(universeId).then(data => {
        setGraphData(data);
      }).catch(console.error);
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
      <UniverseHeader
        universe={universe}
        onAdvance={handleAdvance}
        onFork={handleFork}
        onPulse={handlePulse}
        onToggleAutonomic={handleToggleAutonomic}
        busy={busy}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {/* Message Feedback */}
          {message && (
            <div className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${message.type === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              }`}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="hover:opacity-70">✕</button>
            </div>
          )}
        </div>
        <div className="md:col-span-1 space-y-6">
          <OriginDiagnostic
            origin={universe?.world?.origin || 'Default'}
          />
          <ResonanceMonitor universeId={universeId} />
          <AutonomicControl
            universeId={universeId}
            axioms={universe?.world?.axiom || {}}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <ResonanceWeb universeId={universeId} />
          <ConvergenceMonitor universeId={universeId} currentTick={latestSnapshot?.tick || 0} />
          <EpochNavigator universeId={universeId} />
          <MetricGrid snapshot={latestSnapshot} />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-full">
              <SimulationTopology universeId={universeId} />
            </div>
            <div className="col-span-3 h-full">
              <EventFeed universeId={universeId} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 border-l border-white/5 pl-4 space-y-6">
          <ObservationMonitor observationLoad={universe?.observation_load || 0} />
          <IntegrityMonitor entities={universe?.supreme_entities || []} />
          <UniversalLaw universeId={universeId} />
          <VoidArchive universeId={universeId} />
          <TimelineComparison universeId={universeId} />
          <WarRoom universeId={universeId} />
        </div>
      </div>

      <div className="grid gap-6">

        {/* Row 3: Advanced Controls */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AxiomConsole
            initialAxioms={universe?.world?.axiom || {}}
            onUpdate={handleUpdateAxioms}
            busy={busy}
          />
          <SupremeEntityList universeId={universeId} />
          <CivilizationList universeId={universeId} />
          <FactionList universeId={universeId} />
          <ConvergenceView universeId={universeId} />
          <ArchitectThrone
            universeId={universeId}
            currentTick={latestSnapshot?.tick || 0}
            activeEdicts={latestSnapshot?.metrics?.active_edicts || {}}
          />
          <ScenarioSelector universeId={universeId} />
          <ActorList universeId={universeId} />
        </div>

        {/* Row 4: Material System & Mutations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[600px] border border-emerald-500/20 rounded-xl overflow-hidden bg-slate-900/40">
            <MaterialSystemView universeId={universeId} />
          </div>
          <div className="h-[600px]">
            <GraphView
              nodes={graphData.nodes || []}
              edges={graphData.edges || []}
            />
          </div>
        </div>

        {/* Row 5: Narrative History */}
        <div className="h-[400px]">
          <ChronicleView universeId={universeId} />
        </div>
      </div>
    </div>
  );
}
