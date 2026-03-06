"use client";

import React, { useEffect } from "react";
import { useSimulation, SimulationProvider } from "@/context/SimulationContext";
import { MetricGrid } from "@/components/Simulation/MetricGrid";
import { UniverseTimelineChart } from "@/components/Simulation/UniverseTimelineChart";
import { CivilizationMap } from "@/components/Simulation/CivilizationMap";
import { EventTimelineStrip } from "@/components/Simulation/EventTimelineStrip";
import { CollapseMonitor } from "@/components/Simulation/CollapseMonitor";
import { AttractorPhaseSpaceMap } from "@/components/Simulation/AttractorPhaseSpaceMap";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <SimulationProvider>
      <ObservatoryDashboard />
    </SimulationProvider>
  );
}

function ObservatoryDashboard() {
  const {
    universeId,
    latestSnapshot,
    setUniverseId,
    universes,
    refresh,
    loading: isProcessing,
    error: simError,
  } = useSimulation();

  useEffect(() => {
    if (!universeId && universes.length > 0) {
      setUniverseId(universes[0].id);
    }
  }, [universeId, universes, setUniverseId]);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Civilization Observatory
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Universe {universeId ?? "—"}
            </span>
            <button
              onClick={() => refresh()}
              disabled={isProcessing}
              className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/60 disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {simError && (
          <div className="flex items-center gap-2 p-3 bg-red-900/40 border border-red-500/30 text-red-200 text-sm rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{simError}</span>
          </div>
        )}

        {!universeId ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-12 text-center text-slate-500">
            Chọn universe từ dropdown trên header để xem observatory.
          </div>
        ) : (
          <>
            <p className="text-[10px] text-slate-500">
              Cuộn xuống để xem: Phase space, Civilization map, Event timeline, Collapse monitor.
            </p>
            {/* Panel 1 – Universe metrics */}
            <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Universe metrics
              </h2>
              <MetricGrid snapshot={latestSnapshot} className="grid grid-cols-2 lg:grid-cols-4 gap-4" />
            </section>

            {/* Panel 2 – Universe timeline */}
            <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Universe timeline
              </h2>
              <UniverseTimelineChart universeId={universeId} />
            </section>

            {/* Panel 2b – Phase Space (Emergent Attractors) – measure → cluster → visualize */}
            <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Phase space – Emergent attractors
              </h2>
              <AttractorPhaseSpaceMap universeId={universeId} limit={300} />
            </section>

            {/* Panel 3 & 4 – Civilization map + Event timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm min-h-[320px]">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Civilization map
                </h2>
                <CivilizationMap universeId={universeId} />
              </section>
              <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm min-h-[320px]">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Event timeline
                </h2>
                <EventTimelineStrip universeId={universeId} />
              </section>
            </div>

            {/* Panel 5 – Collapse monitor */}
            <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Collapse monitor
              </h2>
              <CollapseMonitor universeId={universeId} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
