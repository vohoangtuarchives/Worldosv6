"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3-force";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CognitiveTopologyGraph - Phase 60
 * Visualizes Idea Diffusion and School crystallization using d3-force.
 */

interface CognitiveNode extends d3.SimulationNodeDatum {
  id: string;
  type: "idea" | "school";
  name: string;
  influence: number;
  theme?: string;
}

interface CognitiveLink extends d3.SimulationLinkDatum<CognitiveNode> {
  source: string;
  target: string;
  strength: number;
}

interface CognitiveGraphProps {
  universeId: number;
  ideas: any[];
  schools: any[];
  size?: { width: number; height: number };
  className?: string;
}

const THEME_COLORS: Record<string, string> = {
  rationalism: "#06b6d4",
  spirituality: "#3b82f6",
  expansionism: "#f97316",
  order: "#22c55e",
  mercantilism: "#eab308",
  humanism: "#ec4899",
  unknown: "#64748b"
};

export function CognitiveGraph({
  ideas,
  schools,
  size = { width: 600, height: 400 },
  className = ""
}: CognitiveGraphProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<CognitiveNode[]>([]);
  const [links, setLinks] = useState<CognitiveLink[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    // Transform data into graph nodes and links
    const newNodes: CognitiveNode[] = [
      ...ideas.map((id: any) => ({
        id: `idea-${id.id}`,
        type: "idea" as const,
        name: id.theme,
        influence: id.influence,
        theme: id.theme
      })),
      ...schools.map((sch: any) => ({
        id: `school-${sch.id}`,
        type: "school" as const,
        name: sch.name,
        influence: sch.influence,
        theme: sch.idea_theme
      }))
    ];

    const newLinks: CognitiveLink[] = [];
    schools.forEach((sch: any) => {
      // Each school links to its originating theme area
      const relatedIdeaId = `idea-${sch.idea_id}`;
      // In a real scenario, we might have exact idea IDs, 
      // here we link by theme or search for a representative node
      const target = newNodes.find(n => n.id === relatedIdeaId);
      if (target) {
        newLinks.push({
          source: `school-${sch.id}`,
          target: relatedIdeaId,
          strength: sch.influence
        });
      }
    });

    const simulation = d3.forceSimulation<CognitiveNode>(newNodes)
      .force("link", d3.forceLink<CognitiveNode, CognitiveLink>(newLinks).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(size.width / 2, size.height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => (d.type === "school" ? 40 : 20)))
      .on("tick", () => {
        setNodes([...newNodes]);
        setTick(t => t + 1);
      });

    return () => {
      simulation.stop();
    };
  }, [ideas, schools, size.width, size.height]);

  return (
    <div className={`relative bg-slate-900/40 rounded-3xl overflow-hidden border border-slate-800 backdrop-blur-md ${className}`}>
      <svg
        ref={containerRef}
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="cursor-crosshair"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Links */}
        <g strokeOpacity={0.2} stroke="#94a3b8">
          {links.map((link, i) => {
            const source = typeof link.source === "string" ? nodes.find(n => n.id === link.source) : link.source;
            const target = typeof link.target === "string" ? nodes.find(n => n.id === link.target) : link.target;
            
            if (!source || !target || !source.x || !source.y || !target.x || !target.y) return null;
            
            return (
              <line
                key={`link-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                strokeWidth={Math.sqrt(link.strength) * 2}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                x: node.x ?? 0, 
                y: node.y ?? 0, 
                scale: 1, 
                opacity: 1 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {node.type === "school" ? (
                <g>
                  <circle
                    r={20 + node.influence * 20}
                    fill={THEME_COLORS[node.theme ?? "unknown"]}
                    fillOpacity={0.2}
                    className="animate-pulse"
                  />
                  <circle
                    r={12 + node.influence * 12}
                    fill={THEME_COLORS[node.theme ?? "unknown"]}
                    stroke="white"
                    strokeWidth={2}
                    filter="url(#glow)"
                  />
                  <text
                    y={35 + node.influence * 10}
                    textAnchor="middle"
                    className="fill-slate-200 text-[10px] font-bold uppercase tracking-widest pointer-events-none"
                  >
                    {node.name}
                  </text>
                </g>
              ) : (
                <g>
                  <rect
                    width={16}
                    height={16}
                    x={-8}
                    y={-8}
                    rx={4}
                    fill={THEME_COLORS[node.theme ?? "unknown"]}
                    className="rotate-45"
                  />
                  <text
                    y={20}
                    textAnchor="middle"
                    className="fill-slate-400 text-[8px] italic pointer-events-none"
                  >
                    {node.theme}
                  </text>
                </g>
              )}
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Cognitive Topology</h3>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-cyan-400" />
           <span className="text-[10px] text-slate-400">Schools of Thought</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rotate-45 bg-slate-600" />
           <span className="text-[10px] text-slate-400">Diffusion Ideas</span>
        </div>
      </div>
    </div>
  );
}
