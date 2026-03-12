"use client";

import React from "react";
import { Loader2, Zap } from "lucide-react";
import type { WorldSimulationStatusResponse } from "@/types/simulation";

interface PulseAndAutonomicPanelProps {
  status: WorldSimulationStatusResponse;
  pulseLoading: boolean;
  onPulse: (ticks: number) => void;
  onToggleAutonomic: () => void;
}

export function PulseAndAutonomicPanel({
  status,
  pulseLoading,
  onPulse,
  onToggleAutonomic,
}: PulseAndAutonomicPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {status.autonomic && (
        <section className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Autonomic
          </h2>
          <p className="text-sm text-foreground">
            Fork min: {status.autonomic.fork_entropy_min} · Archive:{" "}
            {status.autonomic.archive_entropy_threshold}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                status.world.is_autonomic
                  ? "bg-emerald-900/50 text-emerald-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {status.world.is_autonomic ? "Bật" : "Tắt"}
            </span>
            <button
              onClick={onToggleAutonomic}
              disabled={pulseLoading}
              className="text-xs px-2 py-1 rounded border border-border bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
            >
              {pulseLoading ? "..." : "Bật/Tắt"}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur-sm">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Pulse World
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={1}
            max={100}
            defaultValue={5}
            id="pulse-ticks"
            className="w-16 rounded border border-border bg-muted text-foreground px-2 py-1 text-sm"
          />
          <label htmlFor="pulse-ticks" className="text-sm text-muted-foreground">
            ticks/universe
          </label>
          <button
            onClick={() => {
              const el = document.getElementById("pulse-ticks") as HTMLInputElement;
              onPulse(el ? parseInt(el.value, 10) || 5 : 5);
            }}
            disabled={pulseLoading}
            className="rounded-md border border-border bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-muted/80 disabled:opacity-50 flex items-center gap-2"
          >
            {pulseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Pulse World
          </button>
        </div>
      </section>
    </div>
  );
}
