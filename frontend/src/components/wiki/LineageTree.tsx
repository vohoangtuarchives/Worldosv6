import React, { useMemo, useEffect } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Edge,
    type Node as FlowNode,
    Position,
    Handle,
    useNodesState,
    useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useWorldStore } from "@/store/useWorldStore";
import { Crown, Network } from "lucide-react";

interface LineageTreeProps {
    rootActorId: string;
}

const nodeWidth = 200;
const nodeHeight = 80;

// Layout algorithm using Dagre
const getLayoutedElements = (nodes: FlowNode[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "TB", ranksep: 60, nodesep: 30 }); // Top to Bottom format for Lineage

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition) {
            node.targetPosition = Position.Top;
            node.sourcePosition = Position.Bottom;
            node.position = {
                x: (nodeWithPosition.x ?? 0) - nodeWidth / 2,
                y: (nodeWithPosition.y ?? 0) - nodeHeight / 2,
            };
        }
    });

    return { nodes, edges };
};

// Custom Node for Lineage Tree
const LineageNode = ({ data }: { data: any }) => {
    const isRoot = data.isRoot;
    
    return (
        <div className={`relative px-4 py-3 min-w-[180px] rounded-lg backdrop-blur-md border transition-all ${
            isRoot 
                ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                : 'bg-[#141518]/90 border-[#3a3731] hover:border-[#8a8573]'
        }`}>
            <Handle type="target" position={Position.Top} className="!w-2 !h-2 bg-[#8a8573] border-none" />
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 bg-[#8a8573] border-none" />

            {isRoot && <Crown className="absolute -top-3 -right-3 text-amber-500 rotate-12" size={24} />}

            <div className="flex flex-col items-center text-center">
                <span className={`text-sm font-black tracking-widest uppercase truncate w-full mb-1 ${isRoot ? 'text-amber-500' : 'text-[#d4cbb3]'}`} style={{ fontFamily: 'Cinzel, serif' }}>
                    {data.label}
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#8a8573]">
                    {data.archetype || 'Actor'}
                </span>
                <div className="flex justify-between w-full mt-2 pt-2 border-t border-[#2a2824] text-[9px] font-mono">
                    <span className="text-violet-400">D: {Math.round(data.dominance)}</span>
                    <span className="text-cyan-500">F: {data.faction_id || 0}</span>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = { lineage: LineageNode };

export function LineageTree({ rootActorId }: LineageTreeProps) {
    const actorNodes = useWorldStore(state => state.actorNodes);
    const graphEdges = useWorldStore(state => state.graphEdges);

    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (!actorNodes.length || !graphEdges.length) return;

        // Trace up to 2 generations up and 3 generations down from RootActorId
        const familySet = new Set<string>();
        const queue = [{ id: rootActorId, depth: 0, direction: 'both' }];
        
        const validEdges: any[] = [];
        
        // Simple BFS to find related family up to depth 3
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (familySet.has(current.id) || current.depth > 3) continue;
            
            familySet.add(current.id);

            // Find children (source -> target) where type is LINEAGE or PARENT_OF
            const childrenEdges = graphEdges.filter(e => 
                (e.source === current.id || (e.source as any)?.id === current.id) && 
                ['LINEAGE', 'PARENT_OF'].includes(e.type)
            );
            
            // Find parents (target -> source)
            const parentEdges = graphEdges.filter(e => 
                (e.target === current.id || (e.target as any)?.id === current.id) && 
                ['LINEAGE', 'PARENT_OF'].includes(e.type)
            );

            childrenEdges.forEach(e => {
                validEdges.push(e);
                queue.push({ id: typeof e.target === 'string' ? e.target : (e.target as any).id, depth: current.depth + 1, direction: 'down' });
            });

            if (current.direction !== 'down') { // Don't look up if we are exploring down
                parentEdges.forEach(e => {
                    validEdges.push(e);
                    queue.push({ id: typeof e.source === 'string' ? e.source : (e.source as any).id, depth: current.depth + 1, direction: 'up' });
                });
            }
        }

        const rawNodes: FlowNode[] = [];
        const rawEdges: Edge[] = [];
        const edgesTracker = new Set<string>();

        familySet.forEach(id => {
            const actor = actorNodes.find(n => n.id === id);
            if (!actor) return;
            
            rawNodes.push({
                id: actor.id,
                type: 'lineage',
                data: {
                    label: actor.name,
                    archetype: actor.archetype,
                    dominance: actor.dominance,
                    faction_id: actor.faction_id,
                    isRoot: actor.id === rootActorId
                },
                position: { x: 0, y: 0 }
            });
        });

        validEdges.forEach(e => {
            const src = typeof e.source === 'string' ? e.source : (e.source as any).id;
            const tgt = typeof e.target === 'string' ? e.target : (e.target as any).id;
            const edgeId = `e-${src}-${tgt}`;
            
            if (!edgesTracker.has(edgeId) && familySet.has(src) && familySet.has(tgt)) {
                edgesTracker.add(edgeId);
                rawEdges.push({
                    id: edgeId,
                    source: src,
                    target: tgt,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#8a8573', strokeWidth: 1.5, opacity: 0.5 },
                });
            }
        });

        // Ensure at least the root node exists if no family
        if (rawNodes.length === 0) {
            const root = actorNodes.find(n => n.id === rootActorId);
            if (root) {
                rawNodes.push({
                    id: root.id,
                    type: 'lineage',
                    data: {
                        label: root.name,
                        archetype: root.archetype,
                        dominance: root.dominance,
                        faction_id: root.faction_id,
                        isRoot: true
                    },
                    position: { x: 0, y: 0 }
                });
            }
        }

        const layouted = getLayoutedElements(rawNodes, rawEdges);
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);

    }, [rootActorId, actorNodes, graphEdges, setNodes, setEdges]);

    return (
        <div className="w-full h-[400px] bg-[#0a0b0d] rounded-lg border border-[#2a2824] overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={20} size={1} color="#2a2824" />
                <Controls className="bg-[#141518] fill-[#8a8573] border-[#2a2824]" />
            </ReactFlow>
            
            {nodes.length <= 1 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                    <div className="text-center">
                        <Network className="text-[#5a574a] mx-auto mb-2" size={24} />
                        <p className="text-[#8a8573] font-serif text-sm">No ancestral lineage recorded in the Neo4j graphs for this actor.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
