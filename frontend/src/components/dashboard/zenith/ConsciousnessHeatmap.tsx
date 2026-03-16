"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Waves, Sparkles } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

interface HeatmapCell {
  zone_id: number;
  x: number;
  y: number;
  intensity: number;
  phase: 'APOTHEOSIS' | 'AWAKENING' | 'DORMANT';
}

const Heatmap3D: React.FC<{ data: HeatmapCell[] }> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Animate whole grid subtly
  useFrame((state) => {
    if (groupRef.current) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
        <Instances limit={25} range={25}>
            <boxGeometry args={[0.8, 1, 0.8]} />
            <meshStandardMaterial />
            {data.map((cell, i) => {
                const isApotheosis = cell.phase === 'APOTHEOSIS';
                const color = isApotheosis ? '#c084fc' : '#9333ea'; // lighter purple for apotheosis
                const heightScale = Math.max(0.1, cell.intensity * 2.5); // height based on intensity
                // Center the 5x5 grid (x and y ideally from 0 to 4)
                const gridX = (cell.x || i % 5) - 2; 
                const gridZ = (cell.y || Math.floor(i / 5)) - 2;

                return (
                    <Instance 
                        key={cell.zone_id}
                        position={[gridX, heightScale / 2, gridZ]} // adjust y to rest on floor
                        scale={[1, heightScale, 1]}
                        color={color}
                    />
                );
            })}
        </Instances>
    </group>
  );
};

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

      <div className="flex-1 relative w-full h-[60%] min-h-[250px] rounded-2xl overflow-hidden border border-purple-500/20 bg-black/40">
         <Canvas camera={{ position: [5, 5, 5], fov: 40 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#c084fc" />
            <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" />
            {data?.heatmap && <Heatmap3D data={data.heatmap} />}
            <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.2} autoRotate autoRotateSpeed={0.5} />
         </Canvas>
  
         <div className="absolute top-2 left-2 text-[10px] text-white/40 font-mono flex items-center gap-2 bg-black/50 px-2 py-1 rounded">
             <Brain className="w-3 h-3 text-purple-400" />
             Topological Projection Active
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
