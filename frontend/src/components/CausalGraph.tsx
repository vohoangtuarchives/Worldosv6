'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Node {
  id: string;
  tick: number;
  content: string;
  x: number;
  y: number;
}

interface Link {
  source: string;
  target: string;
}

interface CausalGraphProps {
  chronicles: any[];
}

const CausalGraph = ({ chronicles }: CausalGraphProps) => {
  // Take last 15 chronicles for the graph to avoid clutter
  const recentChronicles = useMemo(() => chronicles.slice(-15), [chronicles]);

  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = recentChronicles.map((c, i) => ({
      id: `${c.from_tick}-${i}`,
      tick: c.from_tick,
      content: c.content,
      // Temporal-horizontal layout with some vertical jitter
      x: 50 + i * 50,
      y: 100 + Math.sin(i * 1.5) * 40,
    }));

    const links: Link[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
      });
      
      // Occasionally add a "causal jump" link
      if (i > 2 && Math.random() > 0.8) {
        links.push({
          source: nodes[i - 2].id,
          target: nodes[i].id,
        });
      }
    }

    return { nodes, links };
  }, [recentChronicles]);

  return (
    <div className="w-full h-full min-h-[300px] relative bg-void/30 backdrop-blur-xl rounded-[var(--radius)] border border-cosmos/20 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      <div className="absolute top-4 left-5 z-20 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cosmos animate-pulse" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text- cosmos/80">Causal Narrative Graph</h3>
      </div>

      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="xMinYMid meet">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--cosmos))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--cosmos))" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Links */}
          <AnimatePresence>
            {links.map((link, i) => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              if (!source || !target) return null;

              const midX = (source.x + target.x) / 2;
              const pathData = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;

              return (
                <motion.path
                  key={`${link.source}-${link.target}-${i}`}
                  d={pathData}
                  stroke="url(#line-grad)"
                  strokeWidth="1.5"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  filter="url(#glow)"
                />
              );
            })}
          </AnimatePresence>

          {/* Nodes */}
          <AnimatePresence>
            {nodes.map((node, i) => (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill="hsl(var(--cosmos))"
                  className="glow-cosmos"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill="hsl(var(--cosmos))"
                  fillOpacity="0.1"
                  stroke="hsl(var(--cosmos))"
                  strokeWidth="0.5"
                  strokeOpacity="0.3"
                >
                  <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" />
                </circle>
                
                {/* Tooltip-like label for latest nodes */}
                {i === nodes.length - 1 && (
                  <motion.foreignObject
                    x={node.x + 10}
                    y={node.y - 20}
                    width="150"
                    height="40"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="text-[8px] font-mono text-cosmos bg-void/80 border border-cosmos/30 p-1.5 rounded-sm backdrop-blur-md line-clamp-2">
                      {node.content}
                    </div>
                  </motion.foreignObject>
                )}
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(hsl(var(--cosmos))_0.5px,transparent_0.5px)] bg-[size:20px_20px]" />
    </div>
  );
};

export default CausalGraph;
