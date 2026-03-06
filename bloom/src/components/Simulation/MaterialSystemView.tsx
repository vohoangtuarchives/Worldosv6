"use client";

import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, NodeProps, Handle, Position, MarkerType, Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '@/lib/api';
import { Layers } from 'lucide-react';

interface MaterialNodeData {
    label: string;
    ontology: string;
    lifecycle: string;
    description: string;
    culture?: string;
}

const MaterialDataNode = ({ data, selected }: NodeProps<MaterialNodeData>) => {
    const isActive = data.lifecycle === 'active';
    return (
        <div className={`p-2 rounded-lg border-2 w-48 shadow-lg transition-all ${isActive
            ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-slate-900 border-slate-700 opacity-80'
            } ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''}`}>
            <Handle type="target" position={Position.Top} className="!bg-slate-500" />

            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                    <Layers className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-200 text-xs truncate" title={data.label}>{data.label}</span>
                </div>
                {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
                )}
            </div>

            <div className="flex items-center gap-1 mt-1">
                <span className={`text-[8px] px-1 rounded font-bold uppercase tracking-wider ${getOntologyColor(data.ontology)}`}>
                    {data.ontology}
                </span>
                <span className={`text-[8px] px-1 rounded font-bold uppercase tracking-wider bg-slate-800 text-white/50 border border-white/10`}>
                    {data.lifecycle}
                </span>
            </div>

            {data.description && (
                <div className="text-[9px] text-slate-400 mt-2 line-clamp-2 leading-tight border-t border-white/10 pt-1">
                    {data.description}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
        </div>
    );
};

const nodeTypes = {
    materialNode: MaterialDataNode,
};

export default function MaterialSystemView({ universeId }: { universeId: number }) {
    const [dag, setDag] = useState<{ nodes: FlowNode<MaterialNodeData>[], edges: FlowEdge[] }>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDag = async () => {
            try {
                // setLoading(true); // Don't block UI on refresh
                const res = await api.materialDag(universeId);
                if (res.ok && res.nodes) {
                    const mappedNodes = res.nodes.map((n: FlowNode<MaterialNodeData>, idx: number) => {
                        const level = n.data?.ontology === 'physical' ? 0 :
                            n.data?.ontology === 'behavioral' ? 1 :
                                n.data?.ontology === 'institutional' ? 2 : 3;
                        return {
                            ...n,
                            position: n.position && (n.position.x !== 0 || n.position.y !== 0)
                                ? n.position
                                : { x: (idx % 4) * 220, y: level * 160 }
                        };
                    });

                    const mappedEdges = (res.edges || []).map((e: FlowEdge) => ({
                        ...e,
                        animated: true,
                        style: { stroke: '#10b981', strokeWidth: 1.5 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
                    }));

                    setDag({ nodes: mappedNodes, edges: mappedEdges });
                }
            } catch (err) {
                console.error("Failed to fetch Material DAG:", err);
            } finally {
                setLoading(false);
            }
        };

        if (universeId) {
            fetchDag();
            const interval = setInterval(fetchDag, 30000); // 30s auto refresh
            return () => clearInterval(interval);
        }
    }, [universeId]);

    const activeMaterials = useMemo(() =>
        dag.nodes.filter(n => n.data.lifecycle === 'active'),
        [dag.nodes]);

    /*
        const selectedMaterial = useMemo(() =>
            dag.nodes.find(n => n.id === selectedId),
            [dag.nodes, selectedId]);
    */

    const onNodeClick = (_: React.MouseEvent, node: FlowNode) => {
        setSelectedId(node.id);
    };

    const onPaneClick = () => {
        setSelectedId(null);
    };

    if (loading && dag.nodes.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-emerald-500/50 font-mono text-xs uppercase tracking-widest">Initialising Material DAG...</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full max-h-full overflow-hidden rounded-xl">
            {/* Active Concepts Column */}
            <div className="md:col-span-1 border-r border-white/10 p-4 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar bg-slate-950/40">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 sticky top-0 bg-slate-950/90 backdrop-blur pb-2 z-10 border-b border-emerald-500/30">
                    Active Concepts
                </h3>

                {activeMaterials.length === 0 && (
                    <div className="text-center py-8 text-white/30 text-xs italic">
                        No active materials in this epoch.
                    </div>
                )}

                <div className="space-y-2">
                    {activeMaterials.map(mat => (
                        <div
                            key={mat.id}
                            onClick={() => setSelectedId(mat.id)}
                            className={`p-3 rounded border transition-all cursor-pointer ${selectedId === mat.id
                                ? 'bg-emerald-500/20 border-emerald-500/50 scale-[1.02]'
                                : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white tracking-wide">{mat.data.label}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${getOntologyColor(mat.data.ontology)}`}>
                                    {mat.data.ontology}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/50 mt-1 line-clamp-2 leading-relaxed">{mat.data.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* DAG Visualization Column */}
            <div className="md:col-span-2 relative flex flex-col h-full bg-slate-950">
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400 border-b border-teal-500/30 pb-1">
                        Mutation Network
                    </h3>
                </div>

                <div className="flex-1 w-full h-full">
                    <ReactFlow
                        nodes={dag.nodes.map(n => ({ ...n, selected: n.id === selectedId }))}
                        edges={dag.edges}
                        nodeTypes={nodeTypes}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        fitView
                        className="dark"
                        minZoom={0.2}
                    >
                        <Background color="#0f172a" gap={20} size={1} />
                        <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

function getOntologyColor(ontology: string): string {
    switch (ontology?.toLowerCase()) {
        case 'physical': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
        case 'institutional': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        case 'symbolic': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
        case 'behavioral': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        default: return 'bg-white/10 text-white/50 border border-white/20';
    }
}
