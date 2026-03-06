"use client";
import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node as FlowNode,
  type Edge as FlowEdge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Box, Flame, Share2 } from "lucide-react";

interface CustomNodeProps {
  data: { label: string; type: "Universe" | "Snapshot" | "MythScar" };
}

const UniverseNode = ({ data }: CustomNodeProps) => (
  <div className="bg-slate-900 border-2 border-blue-500 rounded-full w-8 h-8 flex items-center justify-center relative cursor-pointer hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <GitBranch className="w-4 h-4 text-blue-400" />
    <div className="absolute top-10 whitespace-nowrap text-[10px] text-slate-300 font-mono">
      <span className="font-bold uppercase block text-blue-400">UNIVERSE</span>
      <span className="opacity-80">{data.label}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const SnapshotNode = ({ data }: CustomNodeProps) => (
  <div className="bg-slate-900 border-2 border-slate-600 rounded-sm w-8 h-8 flex items-center justify-center relative cursor-pointer hover:border-slate-400 transition-colors">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <Box className="w-4 h-4 text-slate-400" />
    <div className="absolute top-10 whitespace-nowrap text-[10px] text-slate-300 font-mono text-center">
      <span className="font-bold uppercase block text-slate-400">STATE</span>
      <span className="opacity-80">{data.label}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const MythScarNode = ({ data }: CustomNodeProps) => (
  <div className="bg-slate-900 border-2 border-red-500 rounded-full w-8 h-8 flex items-center justify-center relative cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-shadow group">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <Flame className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
    <div className="absolute top-10 whitespace-nowrap text-[10px] text-slate-300 font-mono text-center">
      <span className="font-bold uppercase block text-red-500">SCAR</span>
      <span className="opacity-80">{data.label}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const nodeTypes = { Universe: UniverseNode, Snapshot: SnapshotNode, MythScar: MythScarNode };

interface Node {
  id: string;
  type: "Universe" | "Snapshot" | "MythScar";
  label: string;
  data: Record<string, unknown>;
  x?: number;
  y?: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

import { api } from "@/lib/api";

interface Props {
  nodes?: Node[];
  edges?: Edge[];
  universeId?: number;
}

export function CausalTopologyGraph({ nodes: initialNodes, edges: initialEdges, universeId }: Props) {
  const [fetchedData, setFetchedData] = React.useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (universeId && !initialNodes) {
      setLoading(true);
      api.graph(universeId)
        .then((data) => setFetchedData(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [universeId, initialNodes]);

  const nodes = initialNodes || fetchedData.nodes;
  const edges = initialEdges || fetchedData.edges;

  const rfNodes: FlowNode[] = useMemo(
    () =>
      nodes.map((node, i) => ({
        id: node.id,
        type: node.type,
        position: { x: node.x ?? 100 + (i % 5) * 150, y: node.y ?? 100 + Math.floor(i / 5) * 120 },
        data: { label: node.label, type: node.type, raw: node.data },
      })),
    [nodes]
  );

  const rfEdges: FlowEdge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: "rgba(255,255,255,0.2)", strokeWidth: 1, strokeDasharray: "4 4" },
      })),
    [edges]
  );

  return (
    <div className="relative w-full h-[600px] bg-slate-900/50 rounded-xl border border-slate-800 p-1">
      <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400 z-10 pointer-events-none">
        <Share2 className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-wider">Causal Topology Graph</span>
      </div>
      <ReactFlow nodes={rfNodes} edges={rfEdges} nodeTypes={nodeTypes} fitView className="dark">
        <Background color="#334155" gap={16} />
        <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300" />
      </ReactFlow>
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
          <span>PRIMARY REALITY</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-sm bg-slate-600" />
          <span>STATE SNAPSHOT</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
          <span>MYTHIC SCAR</span>
        </div>
      </div>
    </div>
  );
}
