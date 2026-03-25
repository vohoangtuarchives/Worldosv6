import React from 'react';
import { motion } from 'framer-motion';

interface TransitionTimelineProps {
  phase: number; // 0 = Shock, 1 = Adaptation
  target: string;
  startTick: number;
  currentTick: number;
}

const TransitionTimeline: React.FC<TransitionTimelineProps> = ({ phase, target, startTick, currentTick }) => {
  const durationInTicks = 50; // Total duration for the full transition (shock + adaptation)
  const elapsed = currentTick - startTick;
  const rawProgress = (elapsed / durationInTicks) * 100;
  const progress = Math.min(100, Math.max(0, rawProgress));

  const phases = [
    { name: 'Shock Phase', color: 'bg-destructive' },
    { name: 'Adaptation Phase', color: 'bg-cosmos' },
    { name: 'Stabilization', color: 'bg-green-500' }
  ];

  const currentPhaseIndex = progress < 30 ? 0 : (progress < 90 ? 1 : 2);

  return (
    <div className="p-4 bg-void/40 backdrop-blur-xl rounded-[var(--radius)] border border-cosmos/20 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cosmos">Transition Timeline</h4>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">{target} REBINDING</span>
        </div>
        
        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4">
          <motion.div 
            className={`absolute inset-y-0 left-0 ${phases[currentPhaseIndex].color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          {/* Phase markers */}
          <div className="absolute inset-0 flex">
            <div className="w-[30%] border-r border-white/10" />
            <div className="w-[60%] border-r border-white/10" />
          </div>
        </div>

        <div className="flex justify-between items-start gap-2">
          {phases.map((p, i) => (
            <div key={i} className={`flex-1 text-center transition-opacity duration-500 ${i === currentPhaseIndex ? 'opacity-100' : 'opacity-20'}`}>
              <div className={`text-[8px] font-bold uppercase mb-1 truncate ${i === currentPhaseIndex ? 'text-white' : 'text-muted-foreground'}`}>{p.name}</div>
              <div className={`h-1 w-full rounded-full ${p.color} mb-1`} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">Elapsed: <span className="text-white">{elapsed} ticks</span></span>
          <span className="text-muted-foreground">Phase: <span className="text-cosmos">{phase === 0 ? "SHOCK" : "ADAPT"}</span></span>
        </div>
        <span className="text-muted-foreground">Status: <span className={progress >= 100 ? "text-green-500" : "text-yellow-500"}>
          {progress >= 100 ? "SYNCHRONIZED" : "PROCESSING..."}
        </span></span>
      </div>
    </div>
  );
};

export default TransitionTimeline;
