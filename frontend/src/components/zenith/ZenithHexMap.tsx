import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useWorldStore } from '@/store/useWorldStore';

export function ZenithHexMap() {
    const zones = useWorldStore(state => state.zones);
    const zonesArray = useMemo(() => Object.values(zones), [zones]);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Create cylinder for hex (6 radial segments)
    const hexGeometry = useMemo(() => {
        const geo = new THREE.CylinderGeometry(1, 1, 1, 6);
        geo.rotateY(Math.PI / 6); // Pointy top setup
        return geo;
    }, []);
    
    const hexMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.2
    }), []);
    
    useEffect(() => {
        if (!meshRef.current || zonesArray.length === 0) return;
        
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        
        zonesArray.forEach((zone, i) => {
            // Topology returns X and Y roughly between 10 to 90.
            // Let's center it to [-40, 40] by subtracting 50, and scale by some factor if needed.
            const worldX = (zone.x - 50) * 1.5;
            const worldZ = (zone.y - 50) * 1.5;
            
            // Height based on urban density and resource extraction
            const height = 0.5 + (zone.urban_density * 0.05) + (zone.resource_extraction * 0.01);
            
            dummy.position.set(worldX, height / 2, worldZ);
            dummy.scale.set(1, height, 1);
            dummy.updateMatrix();
            
            meshRef.current!.setMatrixAt(i, dummy.matrix);
            
            // Coloring
            if (zone.danger_level === 'CRITICAL') {
                color.setHex(0xe11d48); // Rose 600
            } else if (zone.danger_level === 'WARNING') {
                color.setHex(0xf59e0b); // Amber 500
            } else {
                // Base color based on entropy
                color.setHSL(0.55 - (zone.entropy * 0.5), 0.7, 0.4); 
            }
            
            meshRef.current!.setColorAt(i, color);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [zonesArray]);
    
    if (zonesArray.length === 0) return null;
    
    return (
        <instancedMesh
            ref={meshRef}
            args={[hexGeometry, hexMaterial, zonesArray.length]}
            castShadow
            receiveShadow
        />
    );
}
