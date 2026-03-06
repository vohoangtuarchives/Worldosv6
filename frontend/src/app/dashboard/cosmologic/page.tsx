"use client";

import React, { useState, useEffect } from "react";
import { useSimulation, SimulationProvider } from "@/context/SimulationContext";
import { UniverseHeader } from "@/components/Simulation/UniverseHeader";
import { MetricGrid } from "@/components/Simulation/MetricGrid";
import { EventFeed } from "@/components/Simulation/EventFeed";
import { CausalTopologyGraph } from "@/components/Simulation/CausalTopologyGraph";
import { MaterialEvolutionDAG } from "@/components/Simulation/MaterialEvolutionDAG";
import { ChronicleTimelineView } from "@/components/Simulation/ChronicleTimelineView";
import { ActorList } from "@/components/Simulation/ActorList";
import { Activity, Network, Layers, ScrollText, Info, AlertTriangle, Users } from "lucide-react";
import { api } from "@/lib/api";

export default function CosmologicPage() {
  return (
    <SimulationProvider>
      <CosmologicDashboard />
    </SimulationProvider>
  );
}

function CosmologicDashboard() {
  const {
    universeId,
    universe,
    latestSnapshot,
    setUniverseId,
    universes,
    refresh,
    loading: isProcessing,
    error: simError
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<"topology" | "evolution" | "chronicles" | "actors">("topology");
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Auto-select first universe if none selected
  useEffect(() => {
    if (!universeId && universes.length > 0) {
      setUniverseId(universes[0].id);
    }
  }, [universeId, universes, setUniverseId]);

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
    if (!universeId) return;
    console.log("Fork requested");
  };

  const handlePulse = async (ticks: number) => {
    if (!universeId) return;
    console.log(`Pulse ${ticks} requested`);
  };

  const handleToggleAutonomic = async () => {
    if (!universeId) return;
    console.log("Toggle autonomic requested");
  };

  return (
    <div className="flex flex-col h-screen bg-black text-slate-200 overflow-hidden font-sans relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />
        <Starfield />
      </div>

      {/* Top Header Section */}
      <header className="flex-none p-4 border-b border-slate-800/50 bg-slate-950/30 backdrop-blur-md z-10 relative">
        <div className="relative z-10">
          <UniverseHeader
            universe={universe}
            onAdvance={handleAdvance}
            onFork={handleFork}
            onPulse={handlePulse}
            onToggleAutonomic={handleToggleAutonomic}
            busy={isProcessing}
          />
        </div>
        {simError && (
          <div className="mt-2 p-2 bg-red-900/40 border border-red-500/30 text-red-200 text-sm rounded flex items-center gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{simError}</span>
          </div>
        )}
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex overflow-hidden z-10 relative">
        {/* Left/Center Visualization Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/20 relative backdrop-blur-[2px]">
          {/* Grid Overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
          />
          
          {/* View Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-sm z-10">
            <TabButton 
              active={activeTab === "topology"} 
              onClick={() => setActiveTab("topology")}
              icon={<Network className="w-4 h-4" />}
              label="Causal Topology"
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
              active={activeTab === "actors"} 
              onClick={() => setActiveTab("actors")}
              icon={<Users className="w-4 h-4" />}
              label="Entities"
            />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tick: <span className="text-emerald-400 font-bold">{latestSnapshot?.tick || 0}</span>
              </span>
              <button 
                onClick={() => setShowRightPanel(!showRightPanel)}
                className={`p-1.5 rounded hover:bg-slate-800/50 transition-colors ${showRightPanel ? 'text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-slate-500'}`}
                title="Toggle Details Panel"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Visualization Viewport */}
          <div className="flex-1 relative overflow-hidden z-0">
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
          </div>
        </div>

        {/* Right Context Panel */}
        {showRightPanel && (
          <aside className="w-80 flex-none border-l border-slate-800/50 bg-slate-950/60 backdrop-blur-xl flex flex-col h-full transition-all duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
            <div className="flex-none p-4 border-b border-slate-800/50">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-[10px]">
                <Activity className="w-3 h-3" /> System Metrics
              </h3>
              <div className="space-y-4">
                 <MetricGrid snapshot={latestSnapshot} className="grid grid-cols-1 gap-3" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="p-3 bg-slate-900/30 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="w-3 h-3" /> Anomalies
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded animate-pulse">
                  Live
                </span>
              </div>
              <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
  label 
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
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
        }
      `}
    >
      {active && <div className="absolute inset-0 bg-blue-400/5 animate-pulse" />}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {active && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
    </button>
  );
}

// Simple Starfield Component
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
      {/* Distant Nebula Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-900/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
    </div>
  );
}
