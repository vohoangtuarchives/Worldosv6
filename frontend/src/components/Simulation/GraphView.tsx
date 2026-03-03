import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Box, Flame, Share2 } from 'lucide-react';

interface Node {
    id: string;
    type: 'Universe' | 'Snapshot' | 'MythScar';
    label: string;
    data: any;
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
    // Simple force-directed layout simulation (placeholder)
    // In a real app, we would use reactflow or d3-force

    const processedNodes = useMemo(() => {
        return nodes.map((node, i) => ({
            ...node,
            x: node.x ?? (100 + (i % 5) * 150),
            y: node.y ?? (100 + Math.floor(i / 5) * 120),
        }));
    }, [nodes]);

    const findNode = (id: string) => processedNodes.find(n => n.id === id);

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
                    <g key={node.id}>
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            cx={node.x}
                            cy={node.y}
                            r={12}
                            className={`${node.type === 'Universe' ? 'fill-blue-500' :
                                    node.type === 'Snapshot' ? 'fill-slate-600' :
                                        'fill-red-500'
                                } cursor-pointer hover:stroke-white stroke-2 transition-all`}
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
        </div>
    );
};
