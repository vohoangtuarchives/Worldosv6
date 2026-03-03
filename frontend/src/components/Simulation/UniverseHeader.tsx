"use client";

import React from "react";
import { type Universe } from "@/hooks/useWorldStream";

interface UniverseHeaderProps {
    universe: Universe | null;
    onAdvance: () => void;
    onFork: () => void;
    onPulse: (ticks: number) => void;
    onToggleAutonomic: () => void;
    busy?: boolean;
}

export function UniverseHeader({
    universe,
    onAdvance,
    onFork,
    onPulse,
    onToggleAutonomic,
    busy,
}: UniverseHeaderProps) {
    const [pulseTicks, setPulseTicks] = React.useState(5);

    return (
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-6 rounded-xl border border-border bg-card/30 backdrop-blur-sm">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-gradient-cosmos">
                    {universe?.world?.name || "Initializing..."}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                    <span>ID: {universe?.id || "--"}</span>
                    <span className="text-blue-400">Genre: {universe?.world?.current_genre}</span>
                    <span className="text-purple-400">Origin: {universe?.world?.origin}</span>
                    <button
                        onClick={onToggleAutonomic}
                        className={`px-2 py-0.5 rounded border ${universe?.world?.is_autonomic ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}
                    >
                        Autonomic: {universe?.world?.is_autonomic ? "ON" : "OFF"}
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        className="h-9 w-16 rounded-md border border-input bg-background/50 px-2 text-sm text-center"
                        value={pulseTicks}
                        onChange={(e) => setPulseTicks(Number(e.target.value))}
                        min={1}
                    />
                    <button
                        onClick={() => onPulse(pulseTicks)}
                        disabled={busy || !universe}
                        className="h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        Pulse
                    </button>
                </div>

                <button
                    onClick={onAdvance}
                    disabled={busy || !universe}
                    className="h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                >
                    Tick
                </button>

                <button
                    onClick={onFork}
                    disabled={busy || !universe}
                    className="h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                >
                    Fork
                </button>
            </div>
        </div>
    );
}
