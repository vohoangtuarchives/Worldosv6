"use client";

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Award, Zap } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sphere, MeshDistortMaterial, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

interface FilterThreshold {
  id: string;
  name: string;
  status: 'LOCKED' | 'BREACHED' | 'CURRENT';
  probability: number;
}

interface AscensionGatewayProps {
  thresholds?: FilterThreshold[];
}

const GatewayCore = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} args={[1.5, 2]}>
        <MeshDistortMaterial
          color="#3b82f6"
          emissive="#2563eb"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.8}
          distort={0.3}
          speed={2}
        />
      </Icosahedron>
      {/* Internal energy core */}
      <Sphere args={[0.8, 32, 32]}>
         <meshStandardMaterial 
           color="#f59e0b" 
           emissive="#d97706"
           emissiveIntensity={1}
           transparent
           opacity={0.6}
         />
      </Sphere>
    </Float>
  );
};

export const AscensionGateway: React.FC<AscensionGatewayProps> = ({ thresholds }) => {
  const defaultThresholds: FilterThreshold[] = [
    { id: '1', name: 'Biochemical Persistence', status: 'BREACHED', probability: 1.0 },
    { id: '2', name: 'Neural Coherence', status: 'BREACHED', probability: 1.0 },
    { id: '3', name: 'Causal Sovereignty', status: 'BREACHED', probability: 0.85 },
    { id: '4', name: 'Great Filter #4', status: 'CURRENT', probability: 0.12 },
    { id: '5', name: 'Information Singularity', status: 'LOCKED', probability: 0.05 },
    { id: '6', name: 'Ontological Anchor', status: 'LOCKED', probability: 0.01 },
  ];

  const displayThresholds = thresholds || defaultThresholds;

  return (
    <div className="p-6 bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Ascension Gateway
          </h3>
          <p className="text-xs text-muted-foreground">Monitoring 12 Great Filter Thresholds</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Transcendence Level: 0.72
            </div>
            
            {/* 3D Core Visualization */}
            <div className="w-24 h-24 mt-2">
              <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <GatewayCore />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
              </Canvas>
            </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {displayThresholds.map((filter, index) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-3 rounded-xl border transition-all ${
              filter.status === 'BREACHED' ? 'bg-emerald-500/5 border-emerald-500/20' :
              filter.status === 'CURRENT' ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  filter.status === 'BREACHED' ? 'bg-emerald-500/20 text-emerald-400' :
                  filter.status === 'CURRENT' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-white/10 text-white/40'
                }`}>
                  {filter.status === 'BREACHED' ? <Unlock className="w-4 h-4" /> : 
                   filter.status === 'CURRENT' ? <Zap className="w-4 h-4 animate-pulse" /> : 
                   <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white/90">{filter.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                    Status: {filter.status}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-mono font-bold ${
                  filter.status === 'BREACHED' ? 'text-emerald-400' :
                  filter.status === 'CURRENT' ? 'text-amber-400' :
                  'text-white/20'
                }`}>
                  {(filter.probability * 100).toFixed(0)}%
                </div>
                <div className="text-[9px] text-muted-foreground">Survival Prob</div>
              </div>
            </div>

            {/* Progress line for current */}
            {filter.status === 'CURRENT' && (
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  animate={{ width: ['20%', '80%', '20%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/40 mb-2">
          <span>Global Coherence</span>
          <span>94%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-[94%] bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
        </div>
      </div>
    </div>
  );
};
