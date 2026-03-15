"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Waves, Sparkles } from 'lucide-react';

interface HeatmapCell {
  zone_id: number;
  x: number;
  y: number;
  intensity: number;
  phase: 'APOTHEOSIS' | 'AWAKENING' | 'DORMANT';
}

export const ConsciousnessHeatmap: React.FC<{ universeId: number }> = ({ universeId }) => {
  const [data, setData] = useState<{ heatmap: HeatmapCell[]; resonance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await fetch(`/api/worldos/apex/v10/universes/${universeId}/consciousness`);
        const json = await res.json();
        if (json.heatmap) {
          setData({ heatmap: json.heatmap, resonance: json.global_resonance });
        }
      } catch (err) {
        console.error("Failed to fetch heatmap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 6000);
    return () => clearInterval(interval);
  }, [universeId]);

  if (loading && !data) {
    return <div className="h-64 flex items-center justify-center text-white/10">Probing Consciousness Substrate...</div>;
  }

  return (
    <div className="p-8 bg-purple-500/[0.02] backdrop-blur-3xl border border-purple-500/10 rounded-[2.5rem] relative overflow-visible flex flex-col group transition-all duration-500 hover:bg-purple-500/[0.04]">
      <div className="absolute -top-3 left-8 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Phase Field Monitor</span>
      </div>
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xl font-light text-purple-300">{(data?.resonance || 0).toFixed(4)} <span className="text-xs uppercase font-bold opacity-30">Φ</span></span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-2 relative">
        {data?.heatmap.map((cell) => (
          <motion.div
            key={cell.zone_id}
            className="aspect-square rounded-lg border border-white/5 relative group flex items-center justify-center"
            style={{
              backgroundColor: `rgba(168, 85, 247, ${cell.intensity * 0.6})`,
              boxShadow: cell.intensity > 0.7 ? `0 0 15px rgba(168, 85, 247, ${cell.intensity * 0.4})` : 'none'
            }}
            whileHover={{ scale: 1.1, zIndex: 10 }}
          >
            {cell.phase === 'APOTHEOSIS' && (
                <div className="absolute inset-0 bg-white/10 animate-pulse rounded-lg" />
            )}
            <span className="text-[8px] text-white/20 font-mono group-hover:text-white/60 transition-colors">
              Z{cell.zone_id}
            </span>
          </motion.div>
        ))}

        {/* Dynamic Blobs for V10 feel */}
        <div className="absolute inset-0 pointer-events-none opacity-20 filter blur-3xl">
           <motion.div 
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-600 rounded-full"
            animate={{ 
                x: [0, 50, -30, 0],
                y: [0, -40, 60, 0],
                scale: [1, 1.2, 0.8, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
           />
           <motion.div 
            className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-600 rounded-full"
            animate={{ 
                x: [0, -60, 40, 0],
                y: [0, 50, -30, 0],
                scale: [1, 1.1, 0.9, 1]
            }}
            transition={{ duration: 15, repeat: Infinity }}
           />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-900" />
                <span className="text-white/30">Dormant</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-white/30">Apotheosis</span>
            </div>
        </div>
        <div className="flex items-center gap-1 text-purple-400">
            <Waves className="w-3 h-3" />
            <span className="animate-pulse">Active Resonance</span>
        </div>
      </div>
    </div>
  );
};
