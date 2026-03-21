import { useEffect, useState } from 'react';
import * as d3 from 'd3-force';
import { useWorldStore } from '@/store/useWorldStore';

export interface AstralNode extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    dominance: number;
    faction_id: number;
    archetype: string;
    // Computed by D3
    x?: number;
    y?: number;
    z?: number;
}

export interface AstralEdge extends d3.SimulationLinkDatum<AstralNode> {
    source: string | AstralNode;
    target: string | AstralNode;
    type: string;
}

export function useAstralLayout() {
    const rawNodes = useWorldStore(state => state.actorNodes);
    const rawEdges = useWorldStore(state => state.graphEdges);
    
    const [layoutNodes, setLayoutNodes] = useState<AstralNode[]>([]);
    const [layoutEdges, setLayoutEdges] = useState<AstralEdge[]>([]);

    useEffect(() => {
        if (!rawNodes || rawNodes.length === 0) return;

        // Clone so D3 can mutate
        const nodes: AstralNode[] = rawNodes.map(n => ({ ...n }));
        const links: AstralEdge[] = rawEdges.map(e => ({ ...e }));

        // Simple 2D D3 formulation, we will map x -> X, y -> Z, and randomize Y in component (or assign randomly).
        // For a more 3D look, we can assign a random Z here and let it stay.

        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-20))
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(10))
            .force("center", d3.forceCenter(0, 0))
            .force("x", d3.forceX(0).strength(0.05))
            .force("y", d3.forceY(0).strength(0.05));

        // Let it run 150 ticks synchronously to stabilize
        simulation.tick(150);

        // Map computed X,Y to X,Z. Randomize Y based on faction to give strata.
        nodes.forEach(n => {
            n.z = n.y; // Map D3's Y to 3D Z
            n.y = ((n.faction_id || 0) % 5) * 5 + (Math.random() * 2 - 1); // Elevation by faction
        });

        // Store
        setLayoutNodes(nodes);
        setLayoutEdges(links);

        simulation.stop();
        
    }, [rawNodes, rawEdges]);

    return { nodes: layoutNodes, edges: layoutEdges };
}
