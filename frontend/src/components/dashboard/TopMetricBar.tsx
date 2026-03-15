"use client";

import React from "react";
import { useSimulation } from "@/context/SimulationContext";
import { MetricGrid } from "../Simulation/MetricGrid";
import { AlertTriangle, Zap, Wind, TrendingUp, Infinity } from "lucide-react";

export function TopMetricBar() {
  const { latestSnapshot, universe } = useSimulation();

  if (!latestSnapshot && !universe) return null;

  const metrics = latestSnapshot?.metrics ?? {};
  const stateVector = latestSnapshot?.state_vector ?? {};
  const pressures = stateVector?.pressures ?? metrics?.pressures ?? {};

  const collapsePressure = parseFloat(pressures?.collapse_pressure ?? 0);
  const ascensionPressure = parseFloat(pressures?.ascension_pressure ?? 0);
  const chaosPressure = parseFloat(pressures?.chaos_pressure ?? 0);
  const omegaPressure = parseFloat(pressures?.omega_pressure ?? metrics?.omega_points ?? 0);

  return (
    <div className="flex flex-col gap-2 p-4 border-b border-border/50 bg-card/30 backdrop-blur-xl z-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Core Metrics Grid */}
        <div className="flex-1 min-w-0">
          <MetricGrid snapshot={latestSnapshot} variant="horizontal" className="border-none bg-transparent p-0" />
        </div>

        {/* Pressure Visualizers */}
        <div className="flex flex-wrap items-center gap-6 px-4 py-2 bg-background/40 rounded-lg border border-border/40">
          <PressureMiniBar
            label="Sụp đổ"
            value={collapsePressure}
            icon={<AlertTriangle className="w-3 h-3" />}
            color="bg-orange-500"
            isDanger={collapsePressure >= 0.75}
          />
          <PressureMiniBar
            label="Phi thăng"
            value={ascensionPressure}
            icon={<Zap className="w-3 h-3" />}
            color="bg-violet-500"
            isDanger={ascensionPressure >= 0.85}
          />
          <PressureMiniBar
            label="Hỗn loạn"
            value={chaosPressure}
            icon={<Wind className="w-3 h-3" />}
            color="bg-amber-500"
            isDanger={chaosPressure >= 0.6}
          />
          {omegaPressure > 0 && (
            <PressureMiniBar
              label="Omega"
              value={omegaPressure}
              icon={<Infinity className="w-3 h-3" />}
              color="bg-rose-500"
              isDanger={omegaPressure >= 0.8}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PressureMiniBar({ label, value, icon, color, isDanger }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  isDanger: boolean;
}) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div className="flex flex-col gap-1 w-24">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-tighter">
        <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
          {icon} {label}
        </span>
        <span className={isDanger ? "text-red-400 animate-pulse" : "text-foreground"}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${isDanger ? "bg-red-500 animate-pulse" : color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
