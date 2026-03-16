"use client";

import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface TerminalHorizonGaugeProps {
  infoDensity?: number; // 0 to 1
  entropy?: number;     // 0 to 1
  singularityProgress?: number; // 0 to 1
}

export const TerminalHorizonGauge: React.FC<TerminalHorizonGaugeProps> = ({
  infoDensity = 0.45,
  entropy = 0.55,
  singularityProgress = 0.12
}) => {
  // Calculated rotations and sizes
  const horizonRadius = 80;
  const circumference = 2 * Math.PI * horizonRadius;
  const strokeDashoffset = circumference - (singularityProgress * circumference);

  const SingularityCore = () => {
      const meshRef = useRef<THREE.Mesh>(null);
      useFrame((state) => {
          if (meshRef.current) {
              const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1;
              meshRef.current.scale.setScalar(1 + pulse * singularityProgress);
              meshRef.current.rotation.y += 0.01 + (singularityProgress * 0.05);
          }
      });

      return (
          <Sphere ref={meshRef} args={[1.5, 64, 64]}>
              <MeshDistortMaterial 
                 color="#000000"
                 emissive="#3b82f6"
                 emissiveIntensity={singularityProgress * 5}
                 distort={0.4 + (entropy * 0.3)}
                 speed={2 + (entropy * 5)}
                 roughness={0.2}
              />
          </Sphere>
      );
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-card/30 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_0_50px_rgba(30,58,138,0.2)] overflow-hidden group">
      {/* Background Pulsing Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 animate-pulse" />
      
      {/* Central Circular Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        
        {/* 3D Singularity Canvas overlay */}
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 4] }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#8b5cf6" />
                <SingularityCore />
            </Canvas>
        </div>

        <svg className="w-full h-full transform -rotate-90 relative z-10 pointer-events-none">
          {/* Base Circle */}
          <circle
            cx="96"
            cy="96"
            r={horizonRadius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-white/5"
          />
          {/* Progress Path */}
          <motion.circle
            cx="96"
            cy="96"
            r={horizonRadius}
            stroke="url(#horizon-gradient)"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
          
          <defs>
            <linearGradient id="horizon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none">
          <motion.span 
            className="text-3xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {(singularityProgress * 100).toFixed(1)}%
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] mt-1">
            Terminal Horizon
          </span>
        </div>

        {/* Floating Particles Around Ring */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]"
            initial={{ 
              x: Math.cos(i * 45 * Math.PI / 180) * 90, 
              y: Math.sin(i * 45 * Math.PI / 180) * 90,
              opacity: 0.3
            }}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ 
              duration: 2 + i % 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        ))}
      </div>

      {/* Side Metrics List */}
      <div className="mt-8 grid grid-cols-2 gap-4 w-full">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Info Mass</div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" 
                initial={{ width: 0 }}
                animate={{ width: `${infoDensity * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-emerald-400">{(infoDensity * 1.5).toFixed(2)} TB</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Entropy Flux</div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-crimson-500 shadow-[0_0_8px_#ef4444]" 
                style={{ backgroundColor: '#ef4444' }} // Crimson fallback
                initial={{ width: 0 }}
                animate={{ width: `${entropy * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-rose-400">{(entropy * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Decorative Ornaments */}
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
        <div className="w-8 h-1 bg-white/5 rounded-full" />
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[8px] text-white/10 uppercase tracking-widest">
        Reality Compression Pattern // V10.0
      </div>
    </div>
  );
};
