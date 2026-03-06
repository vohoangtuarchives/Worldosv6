import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Box, Flame, Share2, X } from 'lucide-react';

interface Node {
    id: string;
    type: 'Universe' | 'Snapshot' | 'MythScar';
    label: string;
    data: Record<string, unknown>;
    x: number;
    y: number;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    type: string;
}

interface GraphViewProps {
    nodes: Node[];
    edges: Edge[];
}

export const GraphView: React.FC<GraphViewProps> = ({ nodes, edges }) => {
    const [quickViewNode, setQuickViewNode] = useState<Node | null>(null);

    const processedNodes = useMemo(() => {
        return nodes.map((node, i) => ({
            ...node,
            x: node.x ?? (100 + (i % 5) * 150),
            y: node.y ?? (100 + Math.floor(i / 5) * 120),
        }));
    }, [nodes]);

    const findNode = useCallback((id: string) => processedNodes.find(n => n.id === id), [processedNodes]);
    const onNodeClick = useCallback((node: Node) => {
        setQuickViewNode((prev) => (prev?.id === node.id ? null : node));
    }, []);

    return (
        <div className="relative w-full h-[600px] bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden p-4">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400">
                <Share2 className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider">Causal Topology Graph</span>
            </div>

            <svg className="w-full h-full">
                {/* Render Edges */}
                {edges.map(edge => {
                    const source = findNode(edge.source);
                    const target = findNode(edge.target);
                    if (!source || !target) return null;

                    return (
                        <motion.line
                            key={edge.id}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="white"
                            strokeWidth="1"
                            strokeOpacity="0.2"
                            strokeDasharray="4 4"
                        />
                    );
                })}

                {/* Render Nodes */}
                {processedNodes.map((node) => (
                    <g
                        key={node.id}
                        onClick={() => onNodeClick(node)}
                        className="cursor-pointer"
                        style={{ cursor: 'pointer' }}
                    >
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            cx={node.x}
                            cy={node.y}
                            r={12}
                            className={`${node.type === 'Universe' ? 'fill-blue-500' :
                                    node.type === 'Snapshot' ? 'fill-slate-600' :
                                        'fill-red-500'
                                } hover:stroke-white stroke-2 transition-all ${quickViewNode?.id === node.id ? 'stroke-amber-400 ring-2 ring-amber-400/50' : ''}`}
                        />
                        <foreignObject x={node.x + 15} y={node.y - 10} width="120" height="40">
                            <div className="text-[10px] text-slate-300 font-mono leading-tight">
                                <div className="font-bold uppercase">{node.type}</div>
                                <div className="truncate opacity-60">{node.label}</div>
                            </div>
                        </foreignObject>

                        {/* Icons on nodes */}
                        <g transform={`translate(${node.x - 6}, ${node.y - 6})`}>
                            {node.type === 'Universe' && <GitBranch className="w-3 h-3 text-white" />}
                            {node.type === 'Snapshot' && <Box className="w-3 h-3 text-white" />}
                            {node.type === 'MythScar' && <Flame className="w-3 h-3 text-white" />}
                        </g>
                    </g>
                ))}
            </svg>

            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>PRIMARY REALITY</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>STATE SNAPSHOT</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>MYTHIC SCAR</span>
                </div>
            </div>

            <AnimatePresence>
                {quickViewNode && (
                    <motion.div
                        key={quickViewNode.id}
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        className="absolute top-4 right-4 w-64 rounded-lg border border-slate-600 bg-slate-900/95 shadow-xl backdrop-blur p-4 z-10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono uppercase text-slate-400">Quick View</span>
                            <button
                                type="button"
                                onClick={() => setQuickViewNode(null)}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-slate-500 font-mono">ID</span> <span className="text-slate-200">{quickViewNode.id}</span></div>
                            <div><span className="text-slate-500 font-mono">Type</span> <span className="text-slate-200">{quickViewNode.type}</span></div>
                            <div><span className="text-slate-500 font-mono">Label</span> <span className="text-slate-200 truncate block" title={quickViewNode.label}>{quickViewNode.label}</span></div>
                            {quickViewNode.data && Object.keys(quickViewNode.data).length > 0 && (
                                <div className="pt-2 border-t border-slate-700">
                                    <div className="text-slate-500 font-mono text-xs mb-1">Data</div>
                                    <pre className="text-[10px] text-slate-400 overflow-auto max-h-24 font-mono whitespace-pre-wrap break-words">
                                        {JSON.stringify(quickViewNode.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
