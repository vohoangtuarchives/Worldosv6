import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Activity, Shield, Cpu, Zap, Info } from 'lucide-react';
import SimulationControls from '@/components/SimulationControls';

const Navbar = () => {
  const { 
    civilizationEra, 
    currentTick, 
    universes,
    transition
  } = useSimulationStore();

  return (
    <nav className="fixed top-0 left-[72px] right-0 h-16 flex items-center justify-between px-6 bg-card/5 backdrop-blur-xl border-b border-border/10 z-40">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold">Node_Status</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse glow-emerald-sm" />
            <span className="text-xs font-mono font-bold tracking-tight text-foreground/90 uppercase">
              Operational
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-border/20" />

        <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-void/40 border border-primary/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-mono font-bold text-primary uppercase">{civilizationEra || 'Genesis'}</span>
          </div>
          <div className="w-[1px] h-3 bg-border/20" />
          <span className="text-[10px] font-mono text-muted-foreground tracking-tighter">TIC: {currentTick.toLocaleString()}</span>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <SimulationControls />
      </div>

      <div className="flex items-center gap-6">
        {/* Quick Stats Grid */}
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-mono text-muted-foreground mr-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground/50">Entropy</span>
            <span className="text-foreground/80 font-bold">0.0342</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground/50">Stability</span>
            <span className="text-foreground/80 font-bold">92.4%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground/50">Pattern</span>
            <span className="text-primary font-bold truncate max-w-[80px]">{transition?.target || 'Traditional'}</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-border/20" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cosmos to-primary glow-sm border border-white/10" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
