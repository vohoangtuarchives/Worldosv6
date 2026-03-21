"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sky } from '@react-three/drei';
import { useWorldStore } from '@/store/useWorldStore';
import { ZenithHexMap } from './ZenithHexMap';
import { AstralGraph } from './AstralGraph';

export function ZenithCanvas() {
    const viewMode = useWorldStore(s => s.viewMode);
    return (
        <div className="w-full h-full absolute inset-0 bg-black">
            <Canvas
                shadows
                camera={{ position: [0, 40, 60], fov: 45 }}
                gl={{ powerPreference: "high-performance", antialias: true }}
            >
                {/* Lighting setup for dramatic 2.5D look */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    castShadow
                    position={[50, 100, 30]}
                    intensity={1.5}
                    shadow-mapSize={[2048, 2048]}
                    color="#ffffff"
                />
                <directionalLight position={[-50, 50, -50]} intensity={0.5} color="#88bbff" />
                
                {/* Environment & Sky */}
                <Sky distance={450000} sunPosition={[50, 10, 30]} inclination={0} azimuth={0.25} turbidity={0.1} />
                
                <Suspense fallback={null}>
                    <Environment preset="city" />
                    
                    {/* Conditional Rendering of spatial layers */}
                    {viewMode === 'MACRO' ? <ZenithHexMap /> : <AstralGraph />}
                    
                    {/* A gentle floor to catch shadows underneath the map */}
                    <ContactShadows resolution={1024} scale={150} blur={2} opacity={0.5} far={20} position={[0, -0.5, 0]} />
                </Suspense>

                {/* Controls */}
                <OrbitControls 
                    makeDefault 
                    minDistance={5} 
                    maxDistance={150} 
                    maxPolarAngle={Math.PI / 2 - 0.05} 
                    enableDamping 
                    dampingFactor={0.05} 
                />
            </Canvas>
        </div>
    );
}
