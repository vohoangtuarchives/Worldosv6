'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const AxiomResonance = () => {
  const waves = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    initialRotate: i * 45,
    duration: 15 + i * 5,
    delay: -i * 2,
    opacity: 0.05 + i * 0.02
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-void">
      {/* Base Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05)_0%,transparent_70%)]" />
      
      {/* Interference Waves */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center">
         {waves.map((wave) => (
           <motion.div
             key={wave.id}
             className="absolute w-[150vw] h-[150vw] border-[1px] border-cosmos/20 rounded-[45%]"
             initial={{ rotate: wave.initialRotate, scale: 0.8 }}
             animate={{ 
               rotate: wave.initialRotate + 360,
               scale: [0.8, 1.1, 0.8],
               borderRadius: ["45%", "40%", "45%"]
             }}
             transition={{ 
               rotate: { duration: wave.duration, repeat: Infinity, ease: "linear", delay: wave.delay },
               scale: { duration: wave.duration * 0.8, repeat: Infinity, ease: "easeInOut", delay: wave.delay },
               borderRadius: { duration: wave.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: wave.delay }
             }}
             style={{ opacity: wave.opacity }}
           />
         ))}
      </div>

      {/* Grid Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
      
      {/* Subtle Scanline */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
};

export default AxiomResonance;
