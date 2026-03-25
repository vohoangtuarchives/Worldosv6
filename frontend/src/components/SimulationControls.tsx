'use client';

import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, FastForward, Gauge } from 'lucide-react';

const ControlButton = ({ 
  icon: Icon, 
  onClick, 
  active = false, 
  glow = false, 
  disabled = false 
}: { 
  icon: any, 
  onClick: () => void, 
  active?: boolean, 
  glow?: boolean,
  disabled?: boolean
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
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

const SimulationControls = () => {
  const { isPaused, togglePause, currentTick } = useSimulationStore();

  return (
    <div className="flex items-center gap-6 p-2 px-6 bg-void/60 backdrop-blur-3xl rounded-full border border-cosmos/20 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative group cursor-default h-16">
      {/* HUD Accent */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-cosmos/40 blur-[1px] rounded-full" />
      
      <div className="flex items-center gap-3 pr-6 border-r border-border/20">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-muted-foreground tracking-widest uppercase mb-1">Status</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'} animate-pulse`} />
            <span className="text-[10px] font-mono text-foreground/80 uppercase tracking-tighter">
              {isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ControlButton icon={RotateCcw} onClick={() => {}} disabled />
        <ControlButton 
          icon={isPaused ? Play : Pause} 
          onClick={togglePause} 
          active={!isPaused}
          glow={!isPaused}
        />
        <ControlButton icon={FastForward} onClick={() => {}} disabled />
      </div>

      <div className="flex items-center gap-3 pl-6 border-l border-border/20 ml-2">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-mono text-muted-foreground tracking-widest uppercase mb-1">Flux_Rate</span>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-mono text-primary font-bold">1x</span>
             <Gauge size={12} className="text-primary/60" />
          </div>
        </div>
      </div>

      {/* Tick Progress HUD */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-void/80 backdrop-blur-md px-3 py-1 rounded-sm border border-border/40 text-[9px] font-mono text-primary whitespace-nowrap">
          SYNC_VECTOR: {currentTick.toString(16).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default SimulationControls;
