'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FastForward, Gauge, Pause, Play, RotateCcw, type LucideIcon } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';

function ControlButton({
  icon: Icon,
  onClick,
  active = false,
  glow = false,
  disabled = false,
}: {
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  glow?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.06 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-full border transition-all duration-300
        ${active ? 'bg-primary text-primary-foreground border-primary glow-sm' : 'bg-card/40 text-muted-foreground border-border/40 hover:border-primary/50 hover:text-primary'}
        ${glow ? 'glow-cosmos' : ''}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon size={18} />
    </motion.button>
  );
}

const SimulationControls = () => {
  const { isPaused, togglePause, currentTick } = useSimulationStore();

  return (
    <div className="group relative flex h-16 items-center gap-6 rounded-full border border-cosmos/20 bg-void/60 p-2 px-6 shadow-[0_0_30px_rgba(139,92,246,0.15)] backdrop-blur-3xl">
      <div className="absolute -top-1 left-1/2 h-[2px] w-12 -translate-x-1/2 rounded-full bg-cosmos/40 blur-[1px]" />

      <div className="flex items-center gap-3 border-r border-border/20 pr-6">
        <div className="flex flex-col">
          <span className="mb-1 text-[8px] font-mono uppercase tracking-widest text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'} animate-pulse`} />
            <span className="text-[10px] font-mono uppercase tracking-tighter text-foreground/80">
              {isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ControlButton icon={RotateCcw} onClick={() => undefined} disabled />
        <ControlButton icon={isPaused ? Play : Pause} onClick={togglePause} active={!isPaused} glow={!isPaused} />
        <ControlButton icon={FastForward} onClick={() => undefined} disabled />
      </div>

      <div className="ml-2 flex items-center gap-3 border-l border-border/20 pl-6">
        <div className="flex flex-col items-end">
          <span className="mb-1 text-[8px] font-mono uppercase tracking-widest text-muted-foreground">Flux Rate</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-primary">1x</span>
            <Gauge size={12} className="text-primary/60" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="rounded-sm border border-border/40 bg-void/80 px-3 py-1 text-[9px] font-mono text-primary backdrop-blur-md whitespace-nowrap">
          SYNC_VECTOR: {currentTick.toString(16).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default SimulationControls;
