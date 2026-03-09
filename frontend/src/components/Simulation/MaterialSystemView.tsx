"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useSimulation } from '@/context/SimulationContext';

interface MaterialNode {
    id: string;
    data: {
        label: string;
        ontology: string;
        lifecycle: string;
        description: string;
    };
    position: { x: number; y: number };
}

interface MaterialEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export default function MaterialSystemView({ universeId }: { universeId: number }) {
    const [dag, setDag] = useState<{ nodes: MaterialNode[], edges: MaterialEdge[] }>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { latestSnapshot } = useSimulation();

    useEffect(() => {
        const fetchDag = async () => {
            try {
                setLoading(true);
                const res = await api.materialDag(universeId);
                if (res.ok) {
                    setDag({ nodes: res.nodes, edges: res.edges });
                }
            } catch (err) {
                console.error("Failed to fetch Material DAG:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDag();
    }, [universeId, latestSnapshot?.tick]);

    const activeMaterials = useMemo(() =>
        dag.nodes.filter(n => n.data.lifecycle === 'active'),
        [dag.nodes]);

    const selectedMaterial = useMemo(() =>
        dag.nodes.find(n => n.id === selectedId),
        [dag.nodes, selectedId]);

    if (loading && dag.nodes.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-emerald-500/50 font-mono text-xs uppercase tracking-widest">Initialising Material DAG...</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 h-full">
            {/* Active Concepts Column */}
            <div className="md:col-span-1 border-r border-white/10 pr-4 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 sticky top-0 bg-card/80 backdrop-blur pb-2 z-10 border-b border-emerald-500/30">
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
                                    ? 'bg-emerald-500/20 border-emerald-500/50'
                                    : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white">{mat.data.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${getOntologyColor(mat.data.ontology)}`}>
                                    {mat.data.ontology}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{mat.data.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* DAG Visualization Column */}
            <div className="md:col-span-2 relative flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2 border-b border-teal-500/30 pb-2">
                    Mutation Network
                </h3>

                <div className="flex-1 bg-black/40 rounded-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <svg className="w-full h-full max-h-[500px]" viewBox="0 0 800 500">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" fillOpacity="0.5" />
                                </marker>
                            </defs>

                            {/* Simple Auto-Layout logic for SVG visualization */}
                            {dag.edges.map(edge => {
                                const sourceNode = dag.nodes.find(n => n.id === edge.source);
                                const targetNode = dag.nodes.find(n => n.id === edge.target);
                                if (!sourceNode || !targetNode) return null;

                                // Dynamic coordinate calculation (placeholder for real graph layout)
                                const s = getNodePos(edge.source, dag.nodes);
                                const t = getNodePos(edge.target, dag.nodes);

                                return (
                                    <g key={edge.id} className="transition-all duration-1000">
                                        <line
                                            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                            stroke="#10b981" strokeWidth="1" strokeOpacity="0.3"
                                            markerEnd="url(#arrowhead)"
                                            strokeDasharray="5,5"
                                            className="animate-pulse"
                                        />
                                    </g>
                                );
                            })}

                            {dag.nodes.map(node => {
                                const pos = getNodePos(node.id, dag.nodes);
                                const isActive = node.data.lifecycle === 'active';
                                const isSelected = selectedId === node.id;

                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer"
                                        onClick={() => setSelectedId(node.id)}
                                    >
                                        <circle
                                            cx={pos.x} cy={pos.y} r="12"
                                            fill={isActive ? "#10b981" : "#1e293b"}
                                            fillOpacity={isActive ? "0.8" : "0.5"}
                                            stroke={isSelected ? "#fff" : (isActive ? "#10b981" : "#475569")}
                                            strokeWidth={isSelected ? "3" : "1.5"}
                                            className="transition-all duration-300"
                                        />
                                        <text
                                            x={pos.x} y={pos.y + 25}
                                            textAnchor="middle"
                                            className={`text-[9px] font-mono fill-white/70 select-none ${isSelected ? 'font-bold fill-white' : ''}`}
                                        >
                                            {node.data.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* Detail Overlay */}
                    {selectedMaterial && (
                        <div className="absolute bottom-4 right-4 max-w-xs bg-card/90 backdrop-blur-md border border-emerald-500/40 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="text-emerald-400 font-bold text-sm mb-1">{selectedMaterial.data.label}</h4>
                            <div className="flex gap-2 mb-2">
                                <span className={`text-[8px] px-1 rounded font-bold uppercase ${getOntologyColor(selectedMaterial.data.ontology)}`}>
                                    {selectedMaterial.data.ontology}
                                </span>
                                <span className={`text-[8px] px-1 rounded font-bold uppercase bg-muted text-foreground/50 border border-border`}>
                                    {selectedMaterial.data.lifecycle}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/70 italic leading-relaxed">
                                {selectedMaterial.data.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getOntologyColor(ontology: string): string {
    switch (ontology) {
        case 'physical': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
        case 'institutional': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        case 'symbolic': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
        case 'behavioral': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        default: return 'bg-white/10 text-white/50';
    }
}

// Simple deterministic position based on index (until we have real layout)
function getNodePos(id: string, allNodes: MaterialNode[]): { x: number, y: number } {
    const index = allNodes.findIndex(n => n.id === id);
    if (index === -1) return { x: 400, y: 250 };

    // Create a circular or grid layout based on count
    const count = allNodes.length;
    const r = 180;
    const angle = (index / count) * 2 * Math.PI;

    return {
        x: 400 + r * Math.cos(angle - Math.PI / 2),
        y: 250 + r * Math.sin(angle - Math.PI / 2)
    };
}
