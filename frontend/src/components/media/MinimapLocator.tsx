'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MinimapLocatorProps {
  universes: { id: number; name: string }[];
  activeUniverseId: number;
}

const MinimapLocator = ({ universes, activeUniverseId }: MinimapLocatorProps) => {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] text-white/40 uppercase font-bold">Signal Origin</span>
      </div>
      <div className="relative w-full h-24 bg-grid-pattern rounded-lg flex items-center justify-center">
        {universes.map((u, i) => {
          const isActive = u.id === activeUniverseId;
          const angle = (i / universes.length) * 2 * Math.PI;
          const radius = 35;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={u.id}
              className={`absolute w-3 h-3 rounded-full border-2 ${isActive ? 'border-primary bg-primary/50' : 'border-white/20 bg-black/50'}`}
              style={{ 
                top: `calc(50% + ${y}px - 6px)`,
                left: `calc(50% + ${x}px - 6px)`,
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {isActive && (
                <motion.div 
                  className="absolute inset-0 rounded-full bg-primary"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          );
        })}
        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
        </div>
      </div>
    </div>
  );
};

export default MinimapLocator;
