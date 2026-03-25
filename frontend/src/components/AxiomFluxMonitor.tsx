import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '@/store/useSimulationStore';

interface Axiom {
  id: number;
  name: string;
  value: string;
  status: 'syncing' | 'stable' | 'optimal' | 'critical';
  baseValue: number;
  unit: string;
}

const initialAxioms: Axiom[] = [
  { id: 1, name: 'Causality Buffer', value: '', status: 'syncing', baseValue: 4.2, unit: '%' },
  { id: 2, name: 'Entropy Floor', value: '', status: 'stable', baseValue: 0.001, unit: '' },
  { id: 3, name: 'Axiom Pulse', value: '', status: 'optimal', baseValue: 72, unit: 'Hz' },
  { id: 4, name: 'Reality Anchor', value: '', status: 'critical', baseValue: 99.4, unit: '%' },
];

const AxiomFluxMonitor = () => {
  const { currentTick, axioms: storeAxioms } = useSimulationStore();
  const [displayAxioms, setDisplayAxioms] = useState<Axiom[]>(initialAxioms);

  useEffect(() => {
    // Map store axioms to display axioms
    setDisplayAxioms(prev => prev.map(axiom => {
      // Find matching value from store by mapping common IDs
      const storeKey = axiom.name.toLowerCase().replace(/\s+/g, '_').replace('buffer', '').replace('floor', '').trim();
      const liveValue = storeAxioms[storeKey] ?? storeAxioms[axiom.name.toLowerCase().replace(/\s+/g, '_')] ?? null;
      
      if (liveValue === null) {
        // Fallback to perturbation if not in store yet
        const tickPerturb = Math.sin(currentTick * 0.1) * 0.05;
        const fluctuation = ((Math.random() - 0.5) * 0.1 + tickPerturb) * (axiom.baseValue > 1 ? 1 : 0.01);
        const newValue = (axiom.baseValue + fluctuation).toFixed(axiom.baseValue < 1 ? 4 : 1);
        return {
          ...axiom,
          value: `${newValue}${axiom.unit}`,
          status: axiom.status
        };
      }

      // Use live value from store
      const displayValue = liveValue.toFixed(axiom.baseValue < 1 ? 4 : 1);
      
      // Determine status based on value relative to base
      let status: Axiom['status'] = 'stable';
      if (liveValue > axiom.baseValue * 1.2) status = 'critical';
      else if (liveValue > axiom.baseValue * 1.05) status = 'optimal';
      else if (liveValue < axiom.baseValue * 0.8) status = 'syncing';

      return {
        ...axiom,
        value: `${displayValue}${axiom.unit}`,
        status
      };
    }));
  }, [currentTick, storeAxioms]);

  return (
    <div className="flex flex-col gap-4 p-5 bg-void/40 backdrop-blur-2xl rounded-[var(--radius)] border border-cosmos/30 h-full overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.1)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cosmos animate-pulse shadow-[0_0_8px_hsl(var(--cosmos))]" />
          <h4 className="text-xs font-bold tracking-[0.2em] text-cosmos uppercase">Axiom Flux Monitor</h4>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground animate-pulse">
          LIVE_STRM_v2.4
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {displayAxioms.map((axiom) => (
            <motion.div
              key={axiom.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg bg-card/40 border border-border/40 flex items-center justify-between group hover:border-cosmos/50 hover:bg-card/60 transition-all duration-300 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className={`text-[9px] uppercase font-bold font-mono ${
                  axiom.status === 'critical' ? 'text-destructive' : 
                  axiom.status === 'syncing' ? 'text-cosmos' : 
                  'text-muted-foreground'
                }`}>
                  {axiom.status}
                </div>
                <div className="text-sm font-semibold text-foreground/90 tracking-tight">{axiom.name}</div>
              </div>
              <div className="text-right relative z-10">
                <div className="text-sm font-mono font-bold text-primary tabular-nums tracking-tighter">
                  {axiom.value}
                </div>
                <div className="text-[8px] text-muted-foreground font-mono">
                  {Math.random() > 0.5 ? 'SYNC_OK' : 'FLUX_STABLE'}
                </div>
              </div>
              
              {/* Micro-interaction background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cosmos/0 via-cosmos/5 to-cosmos/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-4 border-t border-border/20 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary" /> Signal: Latency 14ms
          </span>
          <span>Buffer: 1024kb</span>
        </div>
        <div className="relative h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-border/10">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-cosmos z-10" 
            animate={{ width: ['20%', '85%', '45%', '95%', '60%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-grid-pattern opacity-20 z-0" />
        </div>
      </div>
    </div>
  );
};

export default AxiomFluxMonitor;

