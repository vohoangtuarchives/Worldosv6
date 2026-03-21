"use client";

import React, { useMemo } from "react";
import { ZenithCanvas } from "@/components/zenith/ZenithCanvas";
import { useSimulation } from "@/context/SimulationContext";
import { useZenithSync } from "@/hooks/useZenithSync";
import { useWorldStore } from "@/store/useWorldStore";
import { Eye, Hexagon, Activity, Map, Network, Flame, Sparkles, Trophy } from "lucide-react";

export default function ZenithDashboardPage() {
    const { universeId, universe, isPaused } = useSimulation();
    const viewMode = useWorldStore(state => state.viewMode);
    const setViewMode = useWorldStore(state => state.setViewMode);
    const sagas = useWorldStore(state => state.sagas);
    const activeCalamities = useWorldStore(state => state.activeCalamities);
    const currentTick = useWorldStore(state => state.currentTick);
    const actorNodes = useWorldStore(state => state.actorNodes);
    
    const topActors = useMemo(() => {
        return [...actorNodes].sort((a, b) => b.dominance - a.dominance).slice(0, 10);
    }, [actorNodes]);

    // Activate the intense data sync
    useZenithSync(universeId);

    if (!universeId) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="text-zinc-500 font-mono text-sm tracking-widest uppercase">
                    No Universe Selected. Please return to Timeline to select a Universe.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen relative bg-black overflow-hidden font-sans">
            {/* The 3D World */}
            <ZenithCanvas />

            {/* Top HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none flex justify-between items-start z-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 backdrop-blur-md border border-cyan-500/30 flex items-center justify-center">
                            <Eye className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
                                {universe?.name || `Universe #${universeId}`}
                            </h1>
                            <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-widest text-cyan-400/80">
                                <Activity size={12} className={!isPaused ? "animate-pulse" : ""} />
                                <span>{isPaused ? "PAUSED" : "ACTIVE SYNC"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pointer-events-auto items-center">
                    {/* Tick Counter */}
                    <div className="mr-6 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-mono text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        TICK: {currentTick.toLocaleString()}
                    </div>
                
                    {/* View Controls */}
                    <button 
                        onClick={() => setViewMode('MACRO')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border transition-colors ${
                            viewMode === 'MACRO' 
                            ? 'bg-zinc-900/80 border-cyan-400/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                            : 'bg-zinc-900/40 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Map size={16} />
                        <span className="text-xs font-bold tracking-widest uppercase">Macro View</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('MICRO')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border transition-colors ${
                            viewMode === 'MICRO' 
                            ? 'bg-zinc-900/80 border-violet-400/50 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)]' 
                            : 'bg-zinc-900/40 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Network size={16} />
                        <span className="text-xs font-bold tracking-widest uppercase">Astral Web</span>
                    </button>
                </div>
            </div>
            
            {/* Left Panel - Oracle Stats (Top Actors) */}
            <div className="absolute top-28 left-6 w-72 bottom-24 flex flex-col gap-4 z-10 pointer-events-none">
                {viewMode === 'MICRO' && topActors.length > 0 && (
                    <div className="flex-1 p-4 rounded-xl bg-black/50 backdrop-blur-xl border border-violet-500/20 flex flex-col pointer-events-auto">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                            <Trophy className="text-violet-400" size={16} />
                            <span className="text-xs font-black tracking-widest uppercase text-zinc-200">Dominance Leaderboard</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {topActors.map((actor, idx) => (
                                <div key={actor.id} className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-violet-300 truncate w-32">{actor.name}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase">{actor.archetype || 'UNKNOWN'} | F-{actor.faction_id || 0}</span>
                                    </div>
                                    <span className="text-xs font-mono font-black text-cyan-400">
                                        {Math.round(actor.dominance).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel - Sagas & Calamities */}
            <div className="absolute top-28 right-6 w-80 bottom-24 flex flex-col gap-4 z-10 pointer-events-none">
                {activeCalamities.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-950/40 backdrop-blur-xl border border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.2)] pointer-events-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <Flame className="text-rose-500 animate-pulse" size={16} />
                            <span className="text-xs font-bold tracking-widest uppercase text-rose-400">Active Calamities</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {activeCalamities.slice(0, 3).map((c) => (
                                <div key={c.id} className="text-[11px] text-zinc-300">
                                    <span className="text-rose-400 font-bold">{c.type}:</span> {c.description}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                        <Sparkles className="text-amber-400" size={16} />
                        <span className="text-xs font-black tracking-widest uppercase text-zinc-200">The Loom Chronicle</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {sagas.slice(0, 50).map((saga, i) => (
                            <div key={i} className="text-xs text-zinc-400 leading-relaxed border-l-2 border-amber-500/30 pl-3 py-1">
                                {saga}
                            </div>
                        ))}
                        {sagas.length === 0 && (
                            <div className="text-xs text-zinc-600 italic">No legends recorded yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Panel placeholder */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                <div className="px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                        <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Safe Zones</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                        <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Warning</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-600 shadow-[0_0_10px_#e11d48]" />
                        <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Critical</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
