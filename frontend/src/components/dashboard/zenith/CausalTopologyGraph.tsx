"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Zap, Globe } from 'lucide-react';

interface Node {
  id: string;
  type: 'zone' | 'universe';
  label: string;
  metrics: any;
  x?: number;
  y?: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  intensity: number;
}

export const CausalTopologyGraph: React.FC<{ universeId: number }> = ({ universeId }) => {
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/worldos/apex/v10/universes/${universeId}/topology`);
        const json = await res.json();
        if (json.topology) {
          // Simple force-directed-ish layout for SVG
          const nodes = json.topology.nodes.map((n: any, i: number) => ({
            ...n,
            x: 100 + Math.cos(i * 0.8) * 150 + Math.random() * 20,
            y: 100 + Math.sin(i * 0.8) * 150 + Math.random() * 20
          }));
          setData({ nodes, edges: json.topology.edges });
        }
      } catch (err) {
        console.error("Failed to fetch topology:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [universeId]);

  if (loading && !data) {
    return (
      <div className="h-64 flex items-center justify-center text-white/20 animate-pulse font-mono text-xs uppercase tracking-widest">
        Synchronizing Manifold...
      </div>
    );
  }

  return (
    <div className="relative py-12 px-8 bg-card/5 backdrop-blur-3xl border border-white/5 rounded-[3rem] min-h-[500px] flex items-center justify-center group overflow-visible">
      <div className="absolute top-8 left-8 flex items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] group-hover:text-fuchsia-400/40 transition-colors">
        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Zone Node</span>
        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]" /> Universe Root</span>
      </div>

      <div className="relative w-full h-full">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {data?.edges.map((edge) => {
            const source = data.nodes.find(n => n.id === edge.source) || { x: 200, y: 200 };
            const target = data.nodes.find(n => n.id === edge.target);
            if (!target) return null;

            return (
              <motion.line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="url(#edgeGradient)"
                strokeWidth={1 + edge.intensity * 2}
                strokeDasharray="4 2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                className="stroke-fuchsia-500/50"
              />
            );
          })}

          {/* Pulse Animations for Edges */}
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#d946ef" stopOpacity="0.8" />
          </linearGradient>

          {/* Nodes */}
          {data?.nodes.map((node, i) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.2 }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === 'zone' ? 6 : 10}
                className={`${node.type === 'zone' ? 'fill-blue-500' : 'fill-fuchsia-500'} cursor-pointer`}
                filter="url(#glow)"
              />
              <text
                x={node.x}
                y={(node.y || 0) + 20}
                textAnchor="middle"
                className="fill-white/40 text-[8px] font-mono pointer-events-none uppercase tracking-tighter"
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>

        {/* Legend / Overlay */}
        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-white/60 font-mono">Resonance: Active</span>
            </div>
            <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-white/60 font-mono">Reality Bleed: 0.02%</span>
            </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-48 h-48 bg-fuchsia-500/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/5 blur-[100px]" />
      </div>
    </div>
  );
};
