"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { api } from "@/lib/api";
import { Globe, Repeat, Zap, Star, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const UniverseNode = ({ data }: any) => {
  const statusColor = data.status === "active" ? "border-emerald-500 shadow-emerald-500/20" : "border-red-500 opacity-60";
  
  return (
    <div className={`bg-card/90 border-2 ${statusColor} rounded-xl p-3 min-w-[140px] shadow-lg relative cursor-pointer hover:shadow-xl transition-all`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-2 mb-1.5">
        <Globe className={`w-4 h-4 ${data.status === "active" ? "text-emerald-400" : "text-muted-foreground"}`} />
        <span className="text-[11px] font-bold text-foreground truncate">{data.label}</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-mono">
          <span>Entropy:</span>
          <span className="text-foreground">{(data.metrics?.entropy ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-mono">
          <span>SCI:</span>
          <span className="text-foreground">{(data.metrics?.sci ?? 0).toFixed(0)}%</span>
        </div>
        <div className="mt-1 text-[8px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono uppercase truncate opacity-70">
          {data.metrics?.attractor ?? "no attractor"}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = { universe: UniverseNode };

export function MultiverseExplorer() {
  const [data, setData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.multiverseMap()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rfNodes: FlowNode[] = useMemo(() => {
    return data.nodes.map((node, i) => ({
      id: String(node.id),
      type: "universe",
      position: { x: 100 + (node.multiverse_id % 3) * 300 + (i % 2) * 150, y: 100 + Math.floor(i / 2) * 180 },
      data: { ...node },
    }));
  }, [data.nodes]);

  const rfEdges: FlowEdge[] = useMemo(() => {
    return data.edges.map((edge, i) => {
      const isTrade = edge.type === "trade";
      return {
        id: `e-${i}`,
        source: String(edge.from),
        target: String(edge.to),
        label: edge.label,
        animated: true,
        style: isTrade 
          ? { stroke: "#d946ef", strokeWidth: 3, strokeDasharray: "8 4", opacity: edge.intensity ?? 0.9, filter: "drop-shadow(0 0 8px #d946ef)" }
          : { stroke: "#3b82f6", strokeWidth: 1.5, opacity: 0.5 },
        labelStyle: { fill: isTrade ? "#d946ef" : "#3b82f6", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" },
      };
    });
  }, [data.edges]);

  return (
    <Card className="bg-card/40 backdrop-blur-md border border-border/60 overflow-hidden h-[650px] flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-border/40 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-fuchsia-400">
            <Repeat className="w-4 h-4" />
            LỘ TRÌNH THƯƠNG MẠI LƯỢNG TỬ (QUANTUM TRADE ROUTES)
          </CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Mạng lưới trao đổi ý nghĩa và tri thức đa vũ trụ (V8)</p>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
             <div className="w-2.5 h-0.5 bg-blue-500 opacity-50" />
             Dòng Nhân Quả
           </div>
           <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-400 font-mono">
             <div className="w-2.5 h-0.5 border-t-2 border-dashed border-fuchsia-500" />
             Luồng Thương Mại
           </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        {loading && <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-[2px] flex items-center justify-center text-xs font-mono text-fuchsia-400 animate-pulse">Đang định vị các nút thắt không-thời gian...</div>}
        
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          className="dark"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls position="bottom-right" className="!bg-muted !border-border !fill-muted-foreground" />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}
