"use client";

import React from "react";
import { type Universe } from "@/types/simulation";

interface UniverseHeaderProps {
    universe: Universe | null;
    universeId?: number | null;
    onAdvance: () => void;
    onFork: () => void;
    onPulse: (ticks: number) => void;
    onToggleAutonomic: () => void;
    onExport?: () => void;
    busy?: boolean;
}

export function UniverseHeader({
    universe,
    universeId: universeIdProp,
    onAdvance,
    onFork,
    onPulse,
    onToggleAutonomic,
    onExport,
    busy,
}: UniverseHeaderProps) {
    const [pulseTicks, setPulseTicks] = React.useState(5);
    const effectiveUniverseId = universeIdProp ?? universe?.id ?? null;

    return (
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 w-full">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 animate-in fade-in slide-in-from-left-2">
                        {universe?.name || universe?.world?.name || "Initializing System..."}
                    </h2>
                    {universe?.world?.is_autonomic && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                        <span className="text-slate-600">ID:</span> 
                        <span className="text-slate-300">#{universe?.id || "--"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="text-slate-600">Genre:</span> 
                        <span className="text-blue-400">{universe?.world?.current_genre}</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="text-slate-600">Origin:</span> 
                        <span className="text-purple-400">{universe?.world?.origin}</span>
                    </span>
                    <button
                        onClick={onToggleAutonomic}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border transition-all duration-300 ${
                            universe?.world?.is_autonomic 
                            ? 'border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                            : 'border-slate-700 text-slate-500 bg-slate-800/50 hover:text-slate-300 hover:border-slate-500'
                        }`}
                    >
                        {universe?.world?.is_autonomic ? "Autonomic Active" : "Manual Mode"}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-0 rounded-md border border-slate-700/50 bg-slate-900/50 p-0.5">
                    <input
                        type="number"
                        className="h-8 w-12 bg-transparent px-2 text-sm text-center text-slate-300 focus:outline-none font-mono"
                        value={pulseTicks}
                        onChange={(e) => setPulseTicks(Number(e.target.value))}
                        min={1}
                    />
                    <button
                        onClick={() => onPulse(pulseTicks)}
                        disabled={busy || !effectiveUniverseId}
                        className="h-8 rounded-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border-l border-slate-700/50"
                    >
                        Pulse
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-800 mx-1" />

                <button
                    onClick={onAdvance}
                    disabled={busy || !effectiveUniverseId}
                    className="h-9 px-4 rounded-md border border-slate-700 bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Tick +1
                </button>

                <button
                    onClick={onFork}
                    disabled={busy || !effectiveUniverseId}
                    className="h-9 px-4 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/50 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Fork Universe
                </button>
            </div>
        </div>
    );
}
