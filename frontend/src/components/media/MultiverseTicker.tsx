'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMultiverseResonance } from '@/modules/observer/api';
import { useSimulationStore } from '@/store/useSimulationStore';

const MultiverseTicker = () => {
  const [isGlitching, setIsGlitching] = useState(false);
  const setSelectedNarrative = useSimulationStore((state) => state.setSelectedNarrative);

  const { data, isLoading } = useMultiverseResonance();

  useEffect(() => {
    if (data) {
      // Trigger glitch effect on new data
      const glitchTimer = setTimeout(() => setIsGlitching(true), 0);
      const resetTimer = setTimeout(() => setIsGlitching(false), 500);
      return () => {
        clearTimeout(glitchTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [data]);

  const pollen = data?.resonance_pollen || [];

  if (isLoading || pollen.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center px-4 overflow-hidden z-[100]">
        <div className="text-[10px] uppercase tracking-widest text-primary/50 animate-pulse">
          Connecting to Multiverse Media Frequency...
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-10 bg-black/90 backdrop-blur-xl border-t border-primary/20 flex items-center overflow-hidden z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${isGlitching ? 'animate-glitch-subtle' : ''}`}>
      {/* Breaking News Label */}
      <div className="bg-primary px-3 h-full flex items-center z-10 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
        <span className="text-[10px] font-black text-black uppercase tracking-tighter whitespace-nowrap animate-pulse">
          Breaking News
        </span>
      </div>

      {/* Scrolling Ticker */}
      <div className="flex-1 relative h-full flex items-center">
        <motion.div
          className="flex whitespace-nowrap gap-16 px-8"
          animate={{
            x: [0, -1000],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Repeat pollen twice for seamless loop */}
          {[...pollen, ...pollen].map((item, idx) => {
            const isHighImpact = item.distortion > 0.5 || item.intensity > 0.8;
            return (
              <div 
              key={`${item.id}-${idx}`} 
              className={`flex items-center gap-4 group cursor-pointer ${isHighImpact ? 'text-red-400' : 'text-white/90'}`}
              onClick={() => setSelectedNarrative(item)}
            >
                <span className={`text-[10px] font-bold uppercase tracking-tight ${isHighImpact ? 'text-red-500' : 'text-primary'}`}>
                  Universe #{item.universe_id}
                </span>
                <span className={`text-sm font-medium transition-colors ${isHighImpact ? 'group-hover:text-red-300' : 'group-hover:text-primary'}`}>
                  {isHighImpact && <span className="mr-2 animate-pulse">⚠️</span>}
                  {item.headline}
                </span>
                <span className={`text-xs italic ${isHighImpact ? 'text-red-400/60' : 'text-white/40'}`}>
                  &quot;{item.slogan}&quot;
                </span>
                <div className={`w-1.5 h-1.5 rounded-full mx-2 ${isHighImpact ? 'bg-red-500/50' : 'bg-primary/30'}`} />
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* System Status */}
      <div className="px-4 border-l border-white/10 h-full flex items-center gap-3 bg-black/40">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] uppercase font-bold text-white/40">Live Resonance</span>
        </div>
        <div className="text-[9px] font-mono text-primary/60">
          ENTROPY: {data?.global_narrative_entropy?.toFixed(4)}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes glitch-subtle {
          0% { transform: translate(0); filter: hue-rotate(0deg); }
          20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
          40% { transform: translate(-1px, -1px); filter: hue-rotate(0deg); }
          60% { transform: translate(2px, 1px); filter: hue-rotate(180deg); }
          80% { transform: translate(1px, -1px); filter: hue-rotate(0deg); }
          100% { transform: translate(0); filter: hue-rotate(0deg); }
        }
        .animate-glitch-subtle {
          animation: glitch-subtle 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MultiverseTicker;
