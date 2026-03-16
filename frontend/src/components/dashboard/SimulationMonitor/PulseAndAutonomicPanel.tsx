"use client";

import React from "react";
import { Loader2, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative">
      {status.autonomic && (
        <motion.section 
            className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm relative overflow-hidden"
            animate={{ 
                boxShadow: status.world.is_autonomic ? "0 0 20px rgba(16, 185, 129, 0.1)" : "none",
                borderColor: status.world.is_autonomic ? "rgba(16, 185, 129, 0.3)" : "var(--border)"
            }}
            transition={{ duration: 1 }}
        >
          {/* Background breathing glow if active */}
          {status.world.is_autonomic && (
              <motion.div 
                 className="absolute inset-0 bg-emerald-500/5 pointer-events-none"
                 animate={{ opacity: [0.3, 0.6, 0.3] }}
                 transition={{ duration: 3, repeat: Infinity }}
              />
          )}
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
        </motion.section>
      )}

      <motion.section 
        className="rounded-lg border border-border bg-card/40 p-4 backdrop-blur-sm relative overflow-hidden"
        animate={{
            boxShadow: pulseLoading ? "0 0 20px rgba(59, 130, 246, 0.2)" : "none",
            borderColor: pulseLoading ? "rgba(59, 130, 246, 0.4)" : "var(--border)"
        }}
        transition={{ duration: 0.5 }}
      >
        {pulseLoading && (
            <motion.div 
                className="absolute inset-0 bg-blue-500/5 pointer-events-none"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
        )}
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
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
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              const el = document.getElementById("pulse-ticks") as HTMLInputElement;
              onPulse(el ? parseInt(el.value, 10) || 5 : 5);
            }}
            disabled={pulseLoading}
            className="rounded-md border border-border bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 relative overflow-hidden"
          >
            {pulseLoading && (
                <div className="absolute inset-0 bg-blue-500/20" />
            )}
            {pulseLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Zap className="w-4 h-4" />}
            <span className="relative z-10">Pulse World</span>
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
}
