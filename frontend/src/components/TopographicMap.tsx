'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const Terrain = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a procedural heightmap
  const { positions, indices } = useMemo(() => {
    const size = 64;
    const geometry = new THREE.PlaneGeometry(20, 20, size, size);
    const pos = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const y = pos[i + 1];
      // Simple landscape: height based on noise-like function
      pos[i + 2] = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 1.5 + 
                   Math.sin(x * 1.2 + y * 0.8) * 0.5;
    }
    
    geometry.computeVertexNormals();
    return { 
      positions: pos,
      indices: geometry.index?.array as Uint16Array 
    };
  }, []);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <meshStandardMaterial 
        color="#8b5cf6" 
        wireframe 
        transparent 
        opacity={0.3} 
        emissive="#8b5cf6" 
        emissiveIntensity={0.5}
      />
      
      {/* Solid Base for Depth */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[20, 20, 64, 64]} />
        <meshStandardMaterial 
          color="#0a0a0c" 
          transparent 
          opacity={0.8}
          roughness={1}
        />
      </mesh>
    </mesh>
  );
};

const EntityMarkers = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const entities = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 10 - 5,
    y: Math.random() * 10 - 5,
    z: 1,
    color: i === 0 ? '#f472b6' : '#8b5cf6' // Hero is pink
  })), []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.z = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {entities.map((e) => (
        <Float key={e.id} speed={2} rotationIntensity={0.5} floatIntensity={1} position={[e.x, e.y, 1.2]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={e.color} emissive={e.color} emissiveIntensity={2} />
          </mesh>
          <pointLight color={e.color} intensity={0.5} distance={2} />
          {e.id === 0 && (
             <Text
                position={[0, 0.4, 0]}
                fontSize={0.2}
                color="#f472b6"
                font="/fonts/inter-bold.woff"
                anchorX="center"
                anchorY="middle"
             >
               PROTAGONIST_01
             </Text>
          )}
        </Float>
      ))}
    </group>
  );
};

const TopographicMap = () => {
  return (
    <div className="w-full h-full relative bg-void/40 backdrop-blur-xl rounded-[var(--radius)] border border-cosmos/20 overflow-hidden shadow-[inset_0_0_50px_rgba(139,92,246,0.1)]">
      <div className="absolute top-4 left-5 z-20 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cosmos animate-pulse" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text- cosmos/80">Topographic Reality Mapping</h3>
      </div>
      
      <div className="absolute top-4 right-5 z-20 flex gap-2">
        <div className="px-2 py-0.5 rounded-sm bg-cosmos/10 border border-cosmos/30 text-[8px] font-mono text-cosmos">
          ISO_MODE: ON
        </div>
      </div>

      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, -12, 12]} fov={35} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
        />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} color="#f472b6" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <group rotation={[Math.PI / 8, 0, 0]}>
            <Terrain />
            <EntityMarkers />
          </group>
        </Float>

        <gridHelper 
          args={[30, 30, 0x8b5cf6, 0x1e1b4b]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, -0.5]}
        />
      </Canvas>

      <div className="absolute bottom-4 left-5 z-20 flex flex-col gap-1">
        <div className="text-[8px] font-mono text-muted-foreground uppercase opacity-50">Terrain Complexity: 8.2v</div>
        <div className="text-[8px] font-mono text-cosmos uppercase">Coordinate Sync: STABLE</div>
      </div>
    </div>
  );
};

export default TopographicMap;
