import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useAstralLayout } from '@/hooks/useAstralLayout';

export function AstralGraph() {
    const { nodes, edges } = useAstralLayout();
    
    const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
    const lineGeoRef = useRef<THREE.BufferGeometry>(null);
    
    // Geometry
    const sphereGeo = useMemo(() => new THREE.IcosahedronGeometry(0.5, 1), []);
    const nodeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.5
    }), []);

    useEffect(() => {
        if (!nodeMeshRef.current || nodes.length === 0) return;
        
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        
        nodes.forEach((n, i) => {
            const dominanceScale = 1 + (n.dominance || 0) * 0.1;
            dummy.position.set(n.x || 0, n.y || 0, n.z || 0);
            dummy.scale.set(dominanceScale, dominanceScale, dominanceScale);
            dummy.updateMatrix();
            nodeMeshRef.current!.setMatrixAt(i, dummy.matrix);
            
            // Color by Faction ID
            const factionHue = ((n.faction_id || 0) * 0.15) % 1.0;
            color.setHSL(factionHue, 0.8, 0.5);
            nodeMeshRef.current!.setColorAt(i, color);
        });
        
        nodeMeshRef.current.instanceMatrix.needsUpdate = true;
        if (nodeMeshRef.current.instanceColor) {
            nodeMeshRef.current.instanceColor.needsUpdate = true;
        }
    }, [nodes]);

    // Update Edges Geometry
    useEffect(() => {
        if (!lineGeoRef.current || edges.length === 0 || nodes.length === 0) return;
        
        const positions = new Float32Array(edges.length * 6); // 2 points per line * 3 coords
        
        let idx = 0;
        edges.forEach((edge) => {
            const source: any = edge.source;
            const target: any = edge.target;
            
            if (source && target && source.x !== undefined && target.x !== undefined) {
                positions[idx++] = source.x;
                positions[idx++] = source.y;
                positions[idx++] = source.z;
                
                positions[idx++] = target.x;
                positions[idx++] = target.y;
                positions[idx++] = target.z;
            }
        });
        
        lineGeoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        lineGeoRef.current.attributes.position.needsUpdate = true;
    }, [edges, nodes]);

    if (nodes.length === 0) return null;

    return (
        <group>
            {/* The Nodes */}
            <instancedMesh
                ref={nodeMeshRef}
                args={[sphereGeo, nodeMaterial, nodes.length]}
                castShadow
                receiveShadow
            />
            {/* The Links (Edges) */}
            <lineSegments>
                <bufferGeometry ref={lineGeoRef} />
                <lineBasicMaterial color={0x22d3ee} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
            </lineSegments>
        </group>
    );
}
