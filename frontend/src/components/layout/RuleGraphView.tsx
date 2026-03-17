"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node as FlowNode,
  type Edge as FlowEdge,
  Handle,
  Position,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Shield, Database, Zap, Activity, Info, FileCode } from "lucide-react";
import { api } from "@/lib/api";

const RuleNode = ({ data }: { data: { label: string; category?: string; file?: string } }) => (
  <div className="bg-card border-2 border-purple-500 rounded-md p-3 min-w-[150px] shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer group">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-purple-400" />
    <div className="flex items-center gap-2 mb-1">
      <Zap className="w-4 h-4 text-purple-400 fill-purple-400/20" />
      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">Rule</span>
    </div>
    <div className="text-xs font-mono font-bold text-foreground mb-1 group-hover:text-purple-300 transition-colors">{data.label}</div>
    {data.category && (
      <div className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block uppercase">
        {data.category}
      </div>
    )}
    <div className="mt-2 text-[8px] text-muted-foreground/50 font-mono truncate max-w-full italic flex items-center gap-1">
        <FileCode className="w-2 h-2" />
        {data.file}
    </div>
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-purple-400" />
  </div>
);

const FieldNode = ({ data }: { data: { label: string } }) => (
  <div className="bg-card border-2 border-blue-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:border-blue-300 transition-colors cursor-pointer">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-blue-400" />
    <Database className="w-3 h-3 text-blue-400" />
    <div className="text-[11px] font-mono text-foreground font-medium">{data.label}</div>
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-blue-400" />
  </div>
);

const nodeTypes = { rule: RuleNode, field: FieldNode };

export function RuleGraphView() {
  const [data, setData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ruleDebugger.graph()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rfNodes: FlowNode[] = useMemo(() => {
    // Simple layout: fields on left, rules on right
    // Better layout would require a library like dagre
    return data.nodes.map((node, i) => {
      const type = node.type;
      const isField = type === 'field';
      return {
        id: node.id,
        type: type,
        data: { label: node.label, category: node.category, file: node.file },
        position: { 
            x: isField ? 100 : 500, 
            y: 50 + i * 80 
        },
      };
    });
  }, [data.nodes]);

  const rfEdges: FlowEdge[] = useMemo(() => {
    return data.edges.map((edge) => {
      const isTrigger = edge.type === 'trigger';
      const isModify = edge.type === 'modify';
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: isModify || isTrigger,
        label: edge.type,
        labelStyle: { fill: '#94a3b8', fontSize: 8, fontWeight: 700, textTransform: 'uppercase' },
        style: { 
            stroke: isTrigger ? '#3b82f6' : (isModify ? '#a855f7' : '#64748b'), 
            strokeWidth: isModify ? 2 : 1,
            strokeDasharray: isTrigger ? '5 5' : '0'
        },
      };
    });
  }, [data.edges]);

  if (loading) return <div className="h-[600px] flex items-center justify-center font-mono text-muted-foreground animate-pulse">ĐANG TRÍCH XUẤT ĐỒ THỊ NHÂN QUẢ...</div>;

  return (
    <div className="relative w-full h-[700px] bg-background rounded-xl border border-border overflow-hidden">
      <Panel position="top-left" className="bg-card/90 backdrop-blur p-4 border border-border rounded-lg shadow-xl m-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-sm tracking-tight">DEBUGGER: RULE CAUSAL GRAPH</h3>
          </div>
          <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed mb-4">
            Bản đồ chi tiết các quy luật vật lý và quan hệ nhân quả. Trigger xác định khi nào luật thực thi, Modify xác định kết quả.
          </p>
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-muted-foreground">
                  <div className="w-3 h-0.5 bg-blue-500 border-t-2 border-dashed border-blue-500" />
                  <span>Trigger Dependency</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-muted-foreground">
                  <div className="w-3 h-0.5 bg-purple-500" />
                  <span>Modification Effect</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-muted-foreground">
                  <div className="w-3 h-0.5 bg-slate-500 border-t-2 border-dotted border-slate-500" />
                  <span>Read Access</span>
              </div>
          </div>
      </Panel>
      
      <ReactFlow 
        nodes={rfNodes} 
        edges={rfEdges} 
        nodeTypes={nodeTypes} 
        fitView 
        className="dark"
      >
        <Background color="#1e293b" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
