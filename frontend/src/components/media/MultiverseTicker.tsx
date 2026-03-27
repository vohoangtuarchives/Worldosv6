'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { observerKeys } from '@/modules/observer/api';
import { fetchClientJson } from '@/shared/api/observer-http';
import type { ResonancePollen, ResonanceResponse } from '@/modules/observer/types';

interface MultiverseTickerProps {
  onHeadlineClick?: (pollen: ResonancePollen) => void;
}

const MultiverseTicker = ({ onHeadlineClick }: MultiverseTickerProps) => {
  const { data, isLoading } = useQuery<ResonanceResponse>({
    queryKey: observerKeys.multiverse.resonance,
    queryFn: () => fetchClientJson('/api/apex/multiverse/resonance'),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

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
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-black/90 backdrop-blur-xl border-t border-primary/20 flex items-center overflow-hidden z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
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
          {[...pollen, ...pollen].map((item, idx) => (
            <div 
              key={`${item.id}-${idx}`} 
              className="flex items-center gap-4 group cursor-pointer"
              onClick={() => onHeadlineClick?.(item)}
            >
              <span className="text-[10px] text-primary font-bold uppercase tracking-tight">
                Universe #{item.universe_id}
              </span>
              <span className="text-sm font-medium text-white/90 group-hover:text-primary transition-colors">
                {item.headline}
              </span>
              <span className="text-xs text-white/40 italic">
                "{item.slogan}"
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30 mx-2" />
            </div>
          ))}
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
    </div>
  );
};

export default MultiverseTicker;
