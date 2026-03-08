"use client";
import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node as FlowNode,
  type Edge as FlowEdge,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Layers, Activity } from "lucide-react";

interface MaterialNodeProps {
  data: {
    label: string;
    tier: number;
    isActive: boolean;
    signature: string;
    energy: number;
  };
}

const MaterialDataNode = ({ data }: MaterialNodeProps) => (
  <div
    className={`p-3 rounded-lg border-2 w-48 shadow-lg transition-transform hover:scale-105 ${
      data.isActive
        ? "bg-slate-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        : "bg-slate-900 border-slate-700 opacity-80"
    }`}
  >
    <Handle type="target" position={Position.Top} className="!bg-slate-500" />
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <Layers className={`w-4 h-4 ${data.isActive ? "text-green-400" : "text-slate-400"}`} />
        <span className="font-bold text-slate-200 text-sm truncate">{data.label}</span>
      </div>
      {data.isActive && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1" />}
    </div>
    <div className="space-y-1 mt-2 border-t border-slate-700/50 pt-2">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-slate-500">Tầng:</span>
        <span className="text-slate-300">I{data.tier === 1 ? "" : data.tier === 2 ? "I" : data.tier === 3 ? "II" : "V"}</span>
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-slate-500">Năng lượng (kV):</span>
        <span className="text-yellow-400">{(data.energy || 0).toFixed(1)}</span>
      </div>
      <div className="text-[9px] text-slate-500 font-mono mt-1 w-full truncate">{data.signature}</div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
  </div>
);

const nodeTypes = { materialNode: MaterialDataNode };

export interface MaterialInstance {
  id: string;
  universe_id: number;
  material_id: number;
  material_name: string;
  tier: number;
  signature: string;
  energy_level: number;
  parent_instance_id: string | null;
  status: "active" | "decayed" | "consumed";
}

import { api } from "@/lib/api";

interface DAGProps {
  instances?: MaterialInstance[];
  universeId?: number;
}

export const MaterialEvolutionDAG: React.FC<DAGProps> = ({ instances: initialInstances, universeId }) => {
  const [fetchedInstances, setFetchedInstances] = React.useState<MaterialInstance[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (universeId && !initialInstances) {
      setLoading(true);
      api.materialDag(universeId)
        .then((data) => {
          // Handle array or object response
          if (Array.isArray(data)) setFetchedInstances(data);
          else if (data && Array.isArray(data.instances)) setFetchedInstances(data.instances);
          else setFetchedInstances([]);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [universeId, initialInstances]);

  const instances = initialInstances || fetchedInstances;

  const { nodes, edges } = useMemo(() => {
    if (!instances) return { nodes: [], edges: [] };
    const rfNodes: FlowNode[] = [];
    const rfEdges: FlowEdge[] = [];
    const levelYSpacing = 160;
    const nodeXSpacing = 220;

    const tierGroups: Record<number, MaterialInstance[]> = {};
    instances.forEach((inst) => {
      if (!tierGroups[inst.tier]) tierGroups[inst.tier] = [];
      tierGroups[inst.tier].push(inst);
    });

    Object.keys(tierGroups).forEach((tierStr) => {
      const tier = parseInt(tierStr);
      const items = tierGroups[tier];
      const startX = -((items.length - 1) * nodeXSpacing) / 2;

      items.forEach((inst, index) => {
        const x = startX + index * nodeXSpacing;
        const y = (tier - 1) * levelYSpacing;
        rfNodes.push({
          id: inst.id,
          type: "materialNode",
          position: { x, y },
          data: {
            label: inst.material_name,
            tier: inst.tier,
            isActive: inst.status === "active",
            signature: inst.signature,
            energy: inst.energy_level,
          },
        });

        if (inst.parent_instance_id) {
          rfEdges.push({
            id: `edge-${inst.parent_instance_id}-${inst.id}`,
            source: inst.parent_instance_id,
            target: inst.id,
            type: "smoothstep",
            animated: inst.status === "active",
            style: { stroke: inst.status === "active" ? "#22c55e" : "#64748b", strokeWidth: 2 },
          } as any);
        }
      });
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [instances]);

  return (
    <div className="relative w-full h-[600px] bg-slate-950/80 rounded-xl border border-slate-800 p-1">
      <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400 z-10 pointer-events-none bg-slate-900/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-slate-800">
        <Activity className="w-5 h-5 text-green-400" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-200">Tiến hóa Material</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Đồ thị có hướng không chu trình</span>
        </div>
      </div>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} className="dark" minZoom={0.1}>
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300" />
      </ReactFlow>
    </div>
  );
};
