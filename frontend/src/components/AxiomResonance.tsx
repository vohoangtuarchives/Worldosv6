'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * AxiomResonance (V5.0): Global Environmental Layer.
 * Provides a subtle, radiant background with resonance wave physics
 * optimized for the Scientific Light HUD.
 */
const AxiomResonance = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const waves = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    id: i,
    initialRotate: i * 90,
    duration: 25 + i * 15,
    delay: -i * 10,
    opacity: 0.02 + i * 0.015,
    color: i % 2 === 0 ? 'bg-primary' : 'bg-amber-400'
  })), []);

  if (!hasMounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-slate-50/50">
      {/* ── Base Environmental Gradients ─────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(7,89,133,0.05)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(245,158,11,0.03)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8)_0%,rgba(248,250,252,0.4)_100%)]" />
      
      {/* ── Resonance Wave Interference ────────────────────── */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center opacity-40">
         {waves.map((wave) => (
           <motion.div
             key={wave.id}
             className={`absolute w-[140vw] h-[140vw] border-[1.5px] border-slate-200/40 rounded-[40%] backdrop-blur-[1px]`}
             initial={{ rotate: wave.initialRotate, scale: 0.85 }}
             animate={{ 
               rotate: wave.initialRotate + 360,
               scale: [0.85, 1.1, 0.85],
               borderRadius: ["40%", "48%", "40%"]
             }}
             transition={{ 
               rotate: { duration: wave.duration, repeat: Infinity, ease: "linear", delay: wave.delay },
               scale: { duration: wave.duration * 0.8, repeat: Infinity, ease: "easeInOut", delay: wave.delay },
               borderRadius: { duration: wave.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: wave.delay }
             }}
             style={{ 
                opacity: wave.opacity,
                boxShadow: `0 0 40px rgba(7, 89, 133, 0.02)` 
             }}
           />
         ))}
      </div>

      {/* ── Precision Technical Overlay ────────────────────── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none mix-blend-multiply" />
      
      {/* ── HUD Scanline Refraction ────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.008] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(7,89,133,0.2)_3px)]" />
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.004] bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(7,89,133,0.2)_3px)]" />

      {/* ── Edge Vignette (Technical Focus) ───────────── */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(7,89,133,0.02)] pointer-events-none" />
    </div>
  );
};

export default AxiomResonance;
