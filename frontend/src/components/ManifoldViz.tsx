'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, TorusKnot, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

function HyperspaceGeometry({ sliceIntensity }: { sliceIntensity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();

  // Create clipping plane
  const clippingPlane = useMemo(() => {
    // Plane moves from bottom to top based on sliceIntensity
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceIntensity * 20 - 10);
  }, [sliceIntensity]);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  useFrame((state) => {
    if (!meshRef.current || !coreRef.current || !pulseRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Complex rotation for hyperspace feeling
    meshRef.current.rotation.x = t * 0.1;
    meshRef.current.rotation.y = t * 0.15;
    meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    
    coreRef.current.rotation.x = -t * 0.2;
    coreRef.current.rotation.z = t * 0.3;
    
    // Riemannian Pulse effect
    const pulseScale = 1 + Math.sin(t * 2) * 0.05;
    pulseRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    pulseRef.current.rotation.y = t * 0.5;
  });

  return (
    <group>
      {/* Outer Manifold - Wireframe Topology */}
      <TorusKnot ref={meshRef} args={[10, 3, 300, 40]}>
        <MeshDistortMaterial
          color="#8b5cf6"
          speed={2}
          distort={0.4}
          radius={1}
          wireframe
          opacity={0.25}
          transparent
          emissive="#6366f1"
          emissiveIntensity={0.8}
          clippingPlanes={[clippingPlane]}
          clipShadows={true}
        />
      </TorusKnot>

      {/* Inner Manifold - Solid Flow */}
      <TorusKnot args={[10, 2.9, 200, 32]}>
        <MeshDistortMaterial
          color="#4f46e5"
          speed={1.5}
          distort={0.3}
          radius={1}
          opacity={0.1}
          transparent
          depthWrite={false}
          clippingPlanes={[clippingPlane]}
          clipShadows={true}
        />
      </TorusKnot>

      {/* Singularity Core */}
      <Sphere ref={coreRef} args={[4, 64, 64]}>
        <MeshDistortMaterial
          color="#ec4899"
          speed={4}
          distort={0.5}
          radius={1}
          opacity={0.2}
          transparent
          emissive="#db2777"
          emissiveIntensity={2}
        />
      </Sphere>

      {/* Pulse Aura */}
      <Sphere ref={pulseRef} args={[4.2, 32, 32]}>
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.05} wireframe />
      </Sphere>

      {/* Temporal Anchors */}
      {[...Array(8)].map((_, i) => (
        <Float key={i} speed={3} rotationIntensity={2} floatIntensity={1.5} position={[
          Math.sin(i * Math.PI * 0.25) * 16,
          Math.cos(i * Math.PI * 0.25) * 16,
          Math.sin(i) * 8
        ]}>
          <group>
            <Sphere args={[0.3, 16, 16]}>
              <meshStandardMaterial 
                color="#6366f1" 
                emissive="#8b5cf6" 
                emissiveIntensity={5} 
              />
            </Sphere>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.55, 32]} />
              <meshBasicMaterial color="#8b5cf6" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

const ManifoldViz = () => {
  const [sliceIntensity, setSliceIntensity] = React.useState(1.0);

  return (
    <div className="w-full h-full min-h-[400px] relative bg-void overflow-hidden rounded-[var(--radius)] border border-border/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      {/* Vignette & Gradients */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--void))_100%)] opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent z-10" />
      
      <div className="absolute top-6 left-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full glow-cosmos" />
          <div>
            <div className="text-[10px] font-mono text-primary/70 uppercase tracking-[0.3em]">Manifold Projection</div>
            <div className="text-2xl font-bold text-foreground mt-1 tracking-tight">22D Hyperspace</div>
          </div>
        </div>
      </div>

      {/* Slicer HUD */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-4">
        <div className="p-3 rounded-md bg-white/5 border border-white/10 backdrop-blur-lg min-w-[180px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Dimensional Slicer</span>
            <span className="text-[10px] font-mono text-cosmos">{Math.round(sliceIntensity * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={sliceIntensity} 
            onChange={(e) => setSliceIntensity(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cosmos"
          />
        </div>
      </div>

      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={45} />
        <Stars radius={100} depth={60} count={6000} factor={6} saturation={0.5} fade speed={1.5} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[20, 30, 10]} intensity={2} color="#8b5cf6" />
        <pointLight position={[-20, -30, -10]} intensity={1.5} color="#ec4899" />
        <spotLight position={[0, 50, 0]} intensity={1} angle={0.4} penumbra={1} color="#6366f1" />
        
        <HyperspaceGeometry sliceIntensity={sliceIntensity} />

        <gridHelper args={[240, 48, 0x4f46e5, 0x1e1b4b]} position={[0, -28, 0]} rotation={[0, 0, 0]} />
      </Canvas>

      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-1">
        <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Topology Status</div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-mono text-emerald-400/90">Riemannian_Stable</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 flex gap-6 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        <div className="flex flex-col items-end">
          <span className="text-foreground/50">Curvature</span>
          <span className="text-primary">0.024λ</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-foreground/50">Complexity</span>
          <span className="text-cosmos">RANK_22</span>
        </div>
      </div>
    </div>
  );
};

export default ManifoldViz;

