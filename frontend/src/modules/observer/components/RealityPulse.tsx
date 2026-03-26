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
 * RealityPulse (V4.1): Quantum-stabilized Visualization with Pulse Sync.
 */
export function RealityPulse({ entropy, stability, tick = 0, size = 140 }: RealityPulseProps) {
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

  // Dynamic values
  const primaryColor = pressure > 0.8 ? '#fb7185' : pressure > 0.4 ? '#fbbf24' : '#38bdf8';
  const pulseDuration = Math.max(0.3, 1.8 - pressure * 1.4);
  const turbulenceFrequency = 0.015 + pressure * 0.06;
  
  return (
    <div 
      className="relative flex items-center justify-center p-4 group"
      style={{ width: size, height: size }}
    >
      {/* Background Quantum Aura */}
      <motion.div
        animate={{
          scale: [1, 1.3 + pressure * 0.4, 1],
          opacity: [0.15, 0.4 + pressure * 0.2, 0.15],
        }}
        transition={{
          repeat: Infinity,
          duration: pulseDuration * 2,
          ease: "linear",
        }}
        className="absolute inset-0 rounded-full blur-[40px]"
        style={{ backgroundColor: primaryColor }}
      />

      <svg width={size} height={size} viewBox="0 0 100 100" className="relative z-10 overflow-visible">
        <defs>
          {/* Quantum Turbulence Filter */}
          <filter id="quantumTurbulence" x="-20%" y="-20%" width="140%" height="140%">
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
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={10 + pressure * 20} />
          </filter>

          <radialGradient id="quantumCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="30%" stopColor={primaryColor} />
            <stop offset="100%" stopColor="transparent" strokeOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Orbital Rings */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="50"
            cy="50"
            r={30 + i * 10}
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.5"
            strokeOpacity={0.1 - i * 0.02}
            strokeDasharray="4 8"
            animate={{ rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
            transition={{ repeat: Infinity, duration: 15 + i * 5, ease: "linear" }}
          />
        ))}

        {/* The Distorted Core */}
        <motion.g filter="url(#quantumTurbulence)">
          {/* Fractal geometry (Triangles) */}
          {[0, 120, 240].map((angle, i) => (
            <motion.path
                key={i}
                d="M 50 20 L 80 70 L 20 70 Z"
                fill="none"
                stroke={primaryColor}
                strokeWidth="1.5"
                strokeOpacity={0.4 + (1-i*0.1)}
                initial={{ rotate: angle, scale: 0.8 }}
                style={{ transformOrigin: '50% 50%' }}
                animate={{
                  rotate: angle + 360,
                  scale: pulseActive ? [1, 1.4, 1] : [0.8, 1 + pressure * 0.2, 0.8],
                  strokeOpacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  repeat: pulseActive ? 0 : Infinity,
                  duration: pulseActive ? 0.6 : pulseDuration * 5,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
          ))}

          {/* Core Singularity */}
          <motion.circle
            cx="50"
            cy="50"
            r={12 + pressure * 15}
            fill="url(#quantumCore)"
            animate={{
              scale: pulseActive ? [1, 1.6, 1] : [1, 1.2, 1],
              opacity: pulseActive ? [0.8, 1, 0.8] : [0.8, 1, 0.8]
            }}
            transition={{
              repeat: pulseActive ? 0 : Infinity,
              duration: pulseActive ? 0.4 : pulseDuration,
              ease: "easeInOut",
            }}
          />
        </motion.g>

        {/* Atmospheric Chaos (Dust/Particles) */}
        {pressure > 0.3 && [...Array(8)].map((_, i) => (
          <motion.circle
            key={i}
            cx={50 + Math.cos(i) * 35}
            cy={50 + Math.sin(i) * 35}
            r={0.5 + Math.random()}
            fill={primaryColor}
            animate={{
              x: [0, (Math.random() - 0.5) * 20],
              y: [0, (Math.random() - 0.5) * 20],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + Math.random() * 2,
              delay: i * 0.3
            }}
          />
        ))}

        {/* Scanning Line (High Stability) */}
        {stability > 0.8 && (
           <motion.line 
             x1="10" y1="50" x2="90" y2="50" 
             stroke="#fff" strokeWidth="0.5" strokeOpacity="0.3"
             animate={{ y1: [30, 70, 30], y2: [30, 70, 30] }}
             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
           />
        )}
      </svg>
      
      {/* HUD Info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-2">
         <motion.span 
           animate={{ 
             opacity: pulseActive ? 1 : [0.4, 0.8, 0.4],
             scale: pulseActive ? 1.2 : 1
           }}
           className={`text-[9px] font-mono tracking-widest uppercase ${pulseActive ? 'text-primary' : 'text-white/60'}`}
         >
            {pulseActive ? 'PULSE_SYNC' : pressure > 0.7 ? 'CAUSAL_WARP' : 'REALITY_LOK'}
         </motion.span>
         <span className="text-xs font-mono font-bold text-white shadow-primary/20">
            {Math.round(stability * 100)}%
         </span>
      </div>
    </div>
  );
}
