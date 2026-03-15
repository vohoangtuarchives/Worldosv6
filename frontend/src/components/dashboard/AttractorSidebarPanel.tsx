"use client";

import React from "react";
import { Orbit, Activity, ShieldAlert } from "lucide-react";
import { AttractorMandala } from "../Simulation/AttractorMandala";
import { useSimulation } from "@/context/SimulationContext";

export function AttractorSidebarPanel({ universeId, refreshTrigger = 0 }: { universeId: number | null; refreshTrigger?: number }) {
  const { latestSnapshot } = useSimulation();

  if (!universeId || !latestSnapshot) return null;

  const fields = latestSnapshot?.state_vector?.fields ?? {
    survival: 0.5,
    reproduction: 0.5,
    wealth: 0.5,
    power: 0.5,
    knowledge: 0.5,
    meaning: 0.5,
    status: 0.5,
    belonging: 0.5,
  };

  const activeAttractors = (latestSnapshot as any)?.active_attractors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <Orbit className="w-4 h-4" /> 8-Attractor Pulse
        </h3>
        <span className="text-[9px] font-mono text-muted-foreground bg-muted/30 px-1.5 rounded">V7 Engine</span>
      </div>

      <div className="flex justify-center py-2 bg-card/20 rounded-xl border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <AttractorMandala fields={fields} size={240} className="scale-90" />
      </div>

      <div className="space-y-3">
        <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> Active Regimes
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {activeAttractors.length > 0 ? (
            activeAttractors.map((attr: string) => (
              <div key={attr} className="flex items-center justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-medium text-blue-100 capitalize">{attr}</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Dominant</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-muted-foreground italic p-2 bg-muted/20 rounded border border-border/40">
              No specific attractor dominant. Global entropy in flux.
            </div>
          )}
        </div>
      </div>
      
      {(latestSnapshot.entropy ?? 0) > 0.7 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex gap-3 items-start animate-pulse">
          <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest leading-none">High Criticality</span>
            <p className="text-[10px] text-orange-200/80 leading-relaxed">
              Resonance patterns are diverging. Attractor basins may collapse into a Great Filter event.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
