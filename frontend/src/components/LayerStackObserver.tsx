'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const initialLayers = [
  { id: 'meta', name: 'Metaphysical', color: 'hsl(var(--cosmos))', description: 'Axioms & Immutable Laws', stability: 98, flux: 1.2, icon: '◈' },
  { id: 'social', name: 'Social', color: 'hsl(var(--right-brain))', description: 'Civilizational Shocks & Trends', stability: 85, flux: 4.8, icon: '⌬' },
  { id: 'mental', name: 'Mental', color: 'hsl(var(--accent))', description: 'Ideologies & Collective Memory', stability: 92, flux: 2.5, icon: '֍' },
  { id: 'bio', name: 'Biological', color: 'hsl(var(--nebula))', description: 'Evolutionary Cascades', stability: 88, flux: 3.1, icon: '♾' },
  { id: 'phys', name: 'Physical', color: 'hsl(var(--left-brain))', description: 'Entropy & Resource Constraints', stability: 94, flux: 0.8, icon: '◬' },
];

const CausalityLinks = () => (
  <svg className="absolute left-[23px] top-6 bottom-6 w-8 pointer-events-none z-0 overflow-visible">
    <defs>
      <linearGradient id="link-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--cosmos))" stopOpacity="0.5" />
        <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
        <stop offset="100%" stopColor="hsl(var(--left-brain))" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 0 0 L 0 350"
      stroke="url(#link-grad)"
      strokeWidth="1"
      fill="none"
      strokeDasharray="4 8"
      animate={{ strokeDashoffset: [0, -24] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
  </svg>
);

const LayerStackObserver = () => {
  const [layers, setLayers] = useState(initialLayers);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayers(prev => prev.map(layer => ({
        ...layer,
        stability: Math.max(0, Math.min(100, layer.stability + (Math.random() - 0.5) * 0.5)),
        flux: Math.max(0, layer.flux + (Math.random() - 0.5) * 0.2),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-5 bg-card/25 backdrop-blur-xl rounded-[var(--radius)] border border-border/40 h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Layer Stack Observer</h3>
        </div>
        <span className="text-[9px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 backdrop-blur-sm">
          REALTY_SYNC: ACTIVE
        </span>
      </div>

      <div className="relative flex-1 flex flex-col justify-between py-2 mt-2">
        <CausalityLinks />

        {layers.map((layer, index) => (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative z-10 flex items-center gap-5 group cursor-pointer"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 glow-sm transition-all duration-500 group-hover:scale-110 group-hover:border-white/20 relative"
              style={{ 
                backgroundColor: `${layer.color}10`, 
                boxShadow: `0 0 25px ${layer.color}${Math.floor((layer.stability / 100) * 40).toString(16)}` 
              }}
            >
              <div className="text-xl transform group-hover:rotate-12 transition-transform duration-500 select-none" style={{ color: layer.color }}>{layer.icon}</div>
              
              {/* Resonance Aura */}
              {layer.stability > 90 && (
                <motion.div 
                  className="absolute inset-0 rounded-xl border border-white/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors flex items-center gap-2">
                  {layer.name}
                  <span className="text-[8px] font-mono text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    ID_{layer.id.toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-primary/80 tabular-nums">
                  {layer.stability.toFixed(1)}% STB
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight line-clamp-1 group-hover:text-muted-foreground/80 transition-colors">
                {layer.description}
              </div>
              
              {/* Mini flux bar */}
              <div className="w-full h-[2px] bg-muted/20 mt-1.5 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full" 
                   style={{ backgroundColor: layer.color }}
                   animate={{ width: `${layer.flux * 15}%` }}
                   transition={{ type: 'spring', stiffness: 50 }}
                />
              </div>
            </div>

            <div className="text-right flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity">
              <div className="text-[9px] font-mono text-foreground/70">
                Δ {layer.flux.toFixed(2)}
              </div>
              <div className="text-[7px] font-mono text-muted-foreground uppercase">
                Flux_Rate
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LayerStackObserver;

