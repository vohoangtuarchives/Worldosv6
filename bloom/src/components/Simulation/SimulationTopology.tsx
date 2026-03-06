"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface Node {
    id: string;
    type: string;
    label: string;
    data: any;
    x?: number;
    y?: number;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    type: string;
}

export function SimulationTopology({ universeId }: { universeId: number | null }) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const containerRef = useRef<SVGSVGElement>(null);

    const FIELDS = [
        { id: 'survival', label: 'Survival', color: '#10b981' },
        { id: 'power', label: 'Power', color: '#f59e0b' },
        { id: 'wealth', label: 'Wealth', color: '#fbbf24' },
        { id: 'knowledge', label: 'Knowledge', color: '#3b82f6' },
        { id: 'meaning', label: 'Meaning', color: '#ec4899' },
    ];

    useEffect(() => {
        if (!universeId) return;

        const fetchGraph = async () => {
            setLoading(true);
            try {
                const res = await api.graph(universeId);
                // Simple layout: Snapshots in a line, Scars orbiting
                const positionedNodes = res.nodes.map((n: Node, i: number) => {
                    if (n.type === 'Snapshot') {
                        return { ...n, x: 100 + i * 80, y: 200 };
                    }
                    if (n.type === 'MythScar') {
                        return { ...n, x: 200 + Math.random() * 400, y: 50 + Math.random() * 100 };
                    }
                    return { ...n, x: 50, y: 50 }; // Universe node
                });
                setNodes(positionedNodes);
                setEdges(res.edges);
            } catch (e) {
                console.error("Graph fetch failed", e);
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
        const interval = setInterval(fetchGraph, 5000);
        return () => clearInterval(interval);
    }, [universeId]);

    return (
        <div className="relative w-full h-[400px] bg-slate-950/50 rounded-xl border border-border overflow-hidden backdrop-blur-md">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-semibold text-blue-400">Topology Visualization</h3>
                <p className="text-xs text-muted-foreground">Mapping causal chains and mythic scars</p>

                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedField(null)}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${!selectedField ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                    >
                        DEFAULT
                    </button>
                    {FIELDS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedField(f.id)}
                            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${selectedField === f.id ? 'border-none text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                            style={selectedField === f.id ? { backgroundColor: f.color } : {}}
                        >
                            {f.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}

            <svg ref={containerRef} className="w-full h-full">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="high-stress-glow">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feFlood floodColor="#ef4444" result="glowColor" />
                        <feComposite in="glowColor" in2="coloredBlur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>

                {/* Edges */}
                {edges.map((edge) => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                        <line
                            key={edge.id}
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke="white"
                            strokeWidth="1"
                            strokeOpacity="0.2"
                            strokeDasharray={edge.type === 'INFLICTED_BY' ? "4 2" : "0"}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                    const isSnapshot = node.type === 'Snapshot';
                    const fieldValue = selectedField ? (node.data?.fields?.[selectedField] ?? 0.1) : 0;
                    const fieldColor = selectedField ? FIELDS.find(f => f.id === selectedField)?.color : '#3b82f6';
                    const isCollapsed = node.data?.collapse_at_tick != null;

                    return (
                        <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                            {/* Collapse Ring */}
                            {isCollapsed && (
                                <circle
                                    r={12}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="1"
                                    strokeDasharray="2 2"
                                    className="animate-spin-slow"
                                />
                            )}

                            <circle
                                r={node.type === 'Universe' ? 12 : isSnapshot ? (6 + fieldValue * 6) : 6}
                                fill={
                                    isSnapshot
                                        ? (selectedField ? fieldColor : (node.data?.material_stress > 0.7 ? '#f87171' : '#3b82f6'))
                                        : node.type === 'MythScar' ? '#ef4444' : '#8b5cf6'
                                }
                                fillOpacity={isSnapshot && selectedField ? 0.3 + fieldValue * 0.7 : 1}
                                filter={node.data?.material_stress > 0.8 || (selectedField && fieldValue > 0.7) ? "url(#high-stress-glow)" : "url(#glow)"}
                                className="cursor-pointer transition-all duration-500 hover:r-10"
                            />
                            <text
                                y={20}
                                textAnchor="middle"
                                className="text-[10px] fill-slate-400 font-mono pointer-events-none"
                            >
                                {node.label}
                            </text>

                            {isCollapsed && (
                                <text
                                    y={-15}
                                    textAnchor="middle"
                                    className="text-[8px] fill-red-500 font-bold uppercase pointer-events-none"
                                >
                                    COLLAPSED
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
