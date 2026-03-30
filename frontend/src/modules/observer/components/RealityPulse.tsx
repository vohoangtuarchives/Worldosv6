'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface RealityPulseProps {
  entropy: number;
  stability: number;
  tick?: number;
  size?: number;
}

/**
 * RealityPulse (V5.0): Scientific Light HUD Optimized.
 * High-fidelity reality coherence visualization.
 */
export function RealityPulse({ entropy, stability, tick = 0, size = 160 }: RealityPulseProps) {
  // Movement State based on tick change
  const [lastTick, setLastTick] = React.useState(tick);
  const [pulseActive, setPulseActive] = React.useState(false);

  React.useEffect(() => {
    if (tick !== lastTick) {
      setLastTick(tick);
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 600);
      return () => clearTimeout(timer);
    }
  }, [tick, lastTick]);

  // Pressure (0 to 1): Synthesis of chaos
  const pressure = useMemo(() => {
    return Math.max(0, Math.min(1, entropy * (1.1 - stability) * 1.2));
  }, [entropy, stability]);

  // Dynamic values (Optimized for Light HUD)
  const primaryColor = pressure > 0.8 ? '#e11d48' : pressure > 0.4 ? '#d97706' : '#075985';
  const glowColor = pressure > 0.8 ? 'rgba(225, 29, 72, 0.1)' : pressure > 0.4 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(7, 89, 133, 0.08)';
  
  const pulseDuration = Math.max(0.3, 1.8 - pressure * 1.4);
  const turbulenceFrequency = 0.015 + pressure * 0.06;
  
  return (
    <div 
      className="relative flex items-center justify-center p-6 group select-none"
      style={{ width: size, height: size }}
    >
      {/* Background Quantum Aura (Optimized for Light Surfaces) */}
      <motion.div
        animate={{
          scale: [1, 1.3 + pressure * 0.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: pulseDuration * 2,
          ease: "linear",
        }}
        className="absolute inset-0 rounded-full blur-[45px]"
        style={{ backgroundColor: glowColor }}
      />

      <svg width="100%" height="100%" viewBox="0 0 100 100" className="relative z-10 overflow-visible">
        <defs>
          {/* Quantum Turbulence Filter */}
          <filter id="quantumTurbulence" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency={turbulenceFrequency} 
              numOctaves="3" 
              result="noise" 
            >
              <animate 
                attributeName="baseFrequency" 
                values={`${turbulenceFrequency}; ${turbulenceFrequency * 1.5}; ${turbulenceFrequency}`} 
                dur={`${pulseDuration * 4}s`} 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={10 + pressure * 25} />
          </filter>

          <radialGradient id="quantumCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="40%" stopColor={primaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Orbital Rings (Scientific HUD style) */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="50"
            cy="50"
            r={32 + i * 12}
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity={0.12 - i * 0.03}
            strokeDasharray={i === 0 ? "1 4" : "4 8"}
            animate={{ rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
            transition={{ repeat: Infinity, duration: 20 + i * 8, ease: "linear" }}
          />
        ))}

        {/* The Distorted Core Geometry */}
        <motion.g filter="url(#quantumTurbulence)">
          {[0, 120, 240].map((angle, i) => (
            <motion.path
                key={i}
                d="M 50 25 L 75 68 L 25 68 Z"
                fill="none"
                stroke={primaryColor}
                strokeWidth="1.2"
                strokeOpacity={0.4 + (1-i*0.1) * 0.3}
                initial={{ rotate: angle, scale: 0.85 }}
                style={{ transformOrigin: '50% 50%' }}
                animate={{
                  rotate: angle + 360,
                  scale: pulseActive ? [1, 1.4, 1] : [0.85, 0.95 + pressure * 0.25, 0.85],
                  strokeOpacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  repeat: pulseActive ? 0 : Infinity,
                  duration: pulseActive ? 0.6 : pulseDuration * 6,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
          ))}

          {/* Core Singularity */}
          <motion.circle
            cx="50"
            cy="50"
            r={10 + pressure * 18}
            fill="url(#quantumCore)"
            animate={{
              scale: pulseActive ? [1, 1.8, 1] : [1, 1.25, 1],
              opacity: pulseActive ? [0.6, 1, 0.6] : [0.7, 0.9, 0.7]
            }}
            transition={{
              repeat: pulseActive ? 0 : Infinity,
              duration: pulseActive ? 0.4 : pulseDuration,
              ease: "easeInOut",
            }}
          />
        </motion.g>

        {/* Atmospheric Chaos Particles */}
        {pressure > 0.3 && (
          [...Array(12)].map((_, i) => {
            const randomSize = 0.4 + ((i * 137) % 100) / 100;
            const randomX = [0, ((i * 223) % 50 - 25)];
            const randomY = [0, ((i * 359) % 50 - 25)];
            const randomDuration = 1.5 + ((i * 491) % 150) / 100;

            return (
              <motion.circle
                key={i}
                cx={50 + Math.cos(i) * 38}
                cy={50 + Math.sin(i) * 38}
                r={randomSize}
                fill={primaryColor}
                animate={{
                  x: randomX,
                  y: randomY,
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.2, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: randomDuration,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              />
            );
          })
        )}

        {/* Scanning Axis (Precision HUD) */}
        {stability > 0.75 && (
           <motion.g
             animate={{ opacity: [0.1, 0.3, 0.1] }}
             transition={{ repeat: Infinity, duration: 3 }}
           >
             <line x1="20" y1="50" x2="80" y2="50" stroke={primaryColor} strokeWidth="0.5" strokeDasharray="1 2" />
             <line x1="50" y1="20" x2="50" y2="80" stroke={primaryColor} strokeWidth="0.5" strokeDasharray="1 2" />
           </motion.g>
        )}
      </svg>
      
      {/* HUD Telemetry Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-3">
         <motion.span 
           animate={{ 
             opacity: pulseActive ? 1 : [0.4, 0.7, 0.4],
             scale: pulseActive ? 1.15 : 1
           }}
           className={`font-heading text-[10px] font-black tracking-[0.25em] uppercase whitespace-nowrap mb-1 ${pulseActive ? 'text-primary' : 'text-slate-400'}`}
         >
            {pulseActive ? 'ĐỒNG BỘ PULSE' : pressure > 0.7 ? 'BIẾN ĐỘNG NHÂN QUẢ' : 'KHÓA THỰC TẠI'}
         </motion.span>
         <div className="flex items-baseline gap-1">
            <span className="font-heading text-xl font-black text-slate-950 italic tracking-tighter drop-shadow-sm">
                {Math.round(stability * 100)}
            </span>
            <span className="text-[10px] font-heading font-black text-slate-300 uppercase">SQ</span>
         </div>
      </div>
    </div>
  );
}
