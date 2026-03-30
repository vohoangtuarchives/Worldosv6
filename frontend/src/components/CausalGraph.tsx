'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ChronicleRecord } from '@/store/useSimulationStore';

interface CausalGraphProps {
  chronicles: ChronicleRecord[];
}

const CausalGraph = ({ chronicles }: CausalGraphProps) => {
  // Chuyển đổi Chronicles thành Nodes và Edges cho React Flow
  const initialNodes: Node[] = useMemo(() => {
    return chronicles.map((c, idx) => {
      // Try to extract loom data from raw_payload if available
      let headline = c.title || `Event ${idx + 1}`;
      let slogan = "The story blooms...";
      
      try {
        const raw = typeof c.raw_payload === 'string' ? JSON.parse(c.raw_payload) : c.raw_payload;
        if (raw?.loom_result?.news_headline) headline = raw.loom_result.news_headline;
        if (raw?.loom_result?.news_slogan) slogan = raw.loom_result.news_slogan;
      } catch { }

      return {
        id: c.id?.toString() || idx.toString(),
        data: { 
          label: (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[9px] text-primary/90">{headline}</span>
              <span className="text-[7px] text-white/50 italic">&quot;{slogan}&quot;</span>
            </div>
          )
        },
        position: { x: idx * 250, y: 100 + (idx % 2) * 100 },
        style: {
          background: 'rgba(30, 30, 30, 0.85)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          fontSize: '10px',
          width: 200,
          padding: '12px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
      };
    });
  }, [chronicles]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < initialNodes.length - 1; i++) {
      edges.push({
        id: `e${i}-${i + 1}`,
        source: initialNodes[i].id,
        target: initialNodes[i + 1].id,
        label: 'leads to',
        animated: true,
        style: { stroke: '#6366f1' },
        labelStyle: { fill: '#818cf8', fontSize: 8, fontWeight: 700 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      });
    }
    return edges;
  }, [initialNodes]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <section className="h-full w-full rounded-[28px] border border-white/10 bg-card/45 backdrop-blur-xl overflow-hidden relative">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.28em] text-primary/70">Causal Graph</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Narrative influence chain</h2>
      </div>

      <div className="h-full w-full mt-12">
        {chronicles.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            colorMode="dark"
          >
            <Background color="#333" gap={20} />
            <Controls />
            <Panel position="bottom-right" className="bg-background/50 p-2 rounded-lg border border-white/10 backdrop-blur-md">
              <p className="text-[8px] text-muted-foreground">Interactive Causal Projection v2</p>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="flex h-full items-center justify-center p-12">
            <div className="rounded-2xl border border-dashed border-white/10 bg-background/25 p-8 text-center">
              <p className="text-sm text-muted-foreground">No chronicle nodes available for graph projection.</p>
              <p className="mt-2 text-[10px] text-muted-foreground/50 italic">Wait for the simulation to bloom...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CausalGraph;
