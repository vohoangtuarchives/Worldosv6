'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSimulationStore } from '@/store/useSimulationStore';

const TimelineSplitter = () => {
  const { universes, currentTick } = useSimulationStore();
  
  // Simulated universe branching if only one exists
  const displayUniverses = useMemo(() => {
    if (universes.length > 1) return universes;
    return [
      { id: 'PRIMARY-001', name: 'Original Reality', stability: 94.2, color: 'hsl(var(--cosmos))' },
      { id: 'EXP-BRANCH-99', name: 'Experimental Divergence', stability: 72.1, color: 'hsl(var(--accent))' }
    ];
  }, [universes]);

  return (
    <div className="w-full h-full p-6 bg-card/20 backdrop-blur-3xl rounded-[var(--radius)] border border-white/10 flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cosmos shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Multiverse Timeline Splitter</h3>
        </div>
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Temporal_Divergence_Active</div>
      </div>

      <div className="flex-1 relative mt-4">
        <svg className="w-full h-full min-h-[120px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="branch-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--cosmos))" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(var(--cosmos))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--cosmos))" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Main Timeline Line */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#branch-grad)" strokeWidth="1" strokeDasharray="4 4" />

          {displayUniverses.map((u, i) => {
            const isPrimary = i === 0;
            const yPos = isPrimary ? '40%' : '70%';
            const color = isPrimary ? 'hsl(var(--cosmos))' : 'hsl(var(--accent))';
            
            return (
              <g key={u.id}>
                {/* Branch Path */}
                <motion.path
                  d={`M 0 50% C 50 50%, 100 ${yPos}, 200 ${yPos} L 1000 ${yPos}`}
                  stroke={color}
                  strokeWidth={isPrimary ? 2 : 1}
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, delay: i * 0.5 }}
                />
                
                {/* Status Indicator */}
                <motion.foreignObject
                  x="50%"
                  y={isPrimary ? '15%' : '80%'}
                  width="180"
                  height="40"
                  initial={{ x: '45%', opacity: 0 }}
                  animate={{ x: '50%', opacity: 1 }}
                  transition={{ delay: 1 + i * 0.5 }}
                >
                  <div className="flex items-center gap-3 p-2 bg-void/60 border border-white/10 rounded-sm backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-white/90 uppercase truncate w-24">{u.name}</span>
                      <span className="text-[8px] font-mono text-white/40">STABILITY: {u.stability}%</span>
                    </div>
                  </div>
                </motion.foreignObject>
              </g>
            );
          })}

          {/* Current Tick Marker */}
          <motion.line
            x1="80%" y1="0" x2="80%" y2="100%"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            animate={{ x: ['79%', '81%', '79%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="absolute bottom-3 right-5 flex gap-4 text-[8px] font-mono text-muted-foreground/30">
        <span>CURR_TICK: {currentTick}</span>
        <span>UNI_COUNT: {displayUniverses.length}</span>
      </div>
    </div>
  );
};

export default TimelineSplitter;
