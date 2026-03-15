"use client";

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  BaseEdge,
  getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { User, Shield, Zap, Heart, Sword } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from "@/lib/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom Node for Actors
const ActorNode = ({ data }: NodeProps) => {
  const isHeroic = !!data.is_heroic;
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border bg-card/80 backdrop-blur-md shadow-xl min-w-[150px] transition-all group hover:scale-105",
      isHeroic ? "border-amber-500/50 glow-amber" : "border-border/60"
    )}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-background/50 border",
          isHeroic ? "border-amber-500/30 text-amber-400" : "border-border/40 text-muted-foreground"
        )}>
          {isHeroic ? <Zap className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div>
          <div className="text-xs font-bold text-foreground truncate max-w-[100px]">{data.label as string}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-tight">{(data.archetype as string) || 'Actor'}</div>
        </div>
      </div>
      
      {/* Influence Bar */}
      <div className="mt-2 h-1 w-full bg-muted/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500/60" 
          style={{ width: `${Math.min(100, (Number(data.influence) || 0) * 100)}%` }}
        />
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Custom Edge for Social Relations
const SocialEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const type = data?.type as string;
  const weight = data?.weight as number || 0.5;

  let strokeColor = "#94a3b8";
  let Icon = Heart;
  
  if (type === 'RIVALRY') {
    strokeColor = "#ef4444";
    Icon = Sword;
  } else if (type === 'TRUST') {
    strokeColor = "#10b981";
    Icon = Heart;
  } else if (type === 'LOYALTY') {
    strokeColor = "#8b5cf6";
    Icon = Shield;
  }

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          stroke: strokeColor, 
          strokeWidth: 2 + (weight * 3),
          opacity: 0.4 + (weight * 0.6)
        }} 
      />
      <foreignObject
        width={20}
        height={20}
        x={labelX - 10}
        y={labelY - 10}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className={cn(
          "flex items-center justify-center w-5 h-5 rounded-full border bg-background/90 backdrop-blur-sm shadow-sm",
          type === 'RIVALRY' ? "border-red-500/40 text-red-400" : 
          type === 'TRUST' ? "border-emerald-500/40 text-emerald-400" :
          "border-violet-500/40 text-violet-400"
        )}>
          <Icon className="w-2.5 h-2.5" />
        </div>
      </foreignObject>
    </>
  );
};

const nodeTypes = {
  Actor: ActorNode,
};

const edgeTypes = {
  TRUST: SocialEdge,
  LOYALTY: SocialEdge,
  RIVALRY: SocialEdge,
};

interface SocialIntegrityGraphProps {
  nodes?: any[];
  edges?: any[];
  universeId?: number;
}

export default function SocialIntegrityGraph({ nodes: initialNodes, edges: initialEdges, universeId }: SocialIntegrityGraphProps) {
  const [fetchedData, setFetchedData] = React.useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (universeId && !initialNodes) {
      setLoading(true);
      api.graph(universeId)
        .then((data: any) => setFetchedData(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [universeId, initialNodes]);

  const rawNodes = initialNodes || fetchedData.nodes || [];
  const rawEdges = initialEdges || fetchedData.edges || [];

  const nodes = useMemo(() => {
    return rawNodes.filter((n: any) => n.type === 'Actor' || n.type === 'Universe').map((n: any, i: number) => {
        // Simple circle layout for actors if no position provided
        const angle = (i / Math.max(1, rawNodes.length)) * Math.PI * 2;
        const radius = 250;
        return {
            ...n,
            position: n.position || { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
            type: n.type,
            data: { ...n.data, label: n.label }
        };
    });
  }, [rawNodes]);

  const edges = useMemo(() => {
    return rawEdges.filter((e: any) => e.type === 'TRUST' || e.type === 'LOYALTY' || e.type === 'RIVALRY').map((e: any) => ({
        ...e,
        type: e.type,
        animated: true,
        data: { ...e.data, type: e.type }
    }));
  }, [rawEdges]);

  if (loading && !nodes.length) {
    return <div className="w-full h-[600px] flex items-center justify-center bg-background/20 rounded-2xl border border-border/40 animate-pulse text-muted-foreground uppercase text-xs font-mono tracking-widest">Đang khởi tạo mạng lưới nhân quả...</div>;
  }

  return (
    <div className="w-full h-[600px] bg-background/20 rounded-2xl border border-border/40 overflow-hidden relative group">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-md border border-border/40 text-[10px] font-bold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Tin cậy (Trust)
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-md border border-border/40 text-[10px] font-bold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          Xung đột (Rivalry)
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-md border border-border/40 text-[10px] font-bold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          Trung thành (Loyalty)
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
      >
        <Background color="#334155" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
