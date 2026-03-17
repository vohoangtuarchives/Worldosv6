"use client";

import React, { useMemo, useCallback, useEffect } from "react";
import dagre from "dagre";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Panel,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 56;

export interface MaterialDagNode {
  id: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    ontology?: string;
    culture?: string;
    lifecycle?: string;
    description?: string;
  };
  type?: string;
}

export interface MaterialDagEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

function getLayouted(nodes: MaterialDagNode[], edges: MaterialDagEdge[], direction = "TB") {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const layoutedNodes: Node[] = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "materialNode",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: n.data,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });

  const layoutedEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "smoothstep",
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

function MaterialNode({ data, selected }: NodeProps) {
  const d = data as MaterialDagNode["data"];
  const isActive = d.lifecycle === "active";
  return (
    <div
      className={`
        px-3 py-2 rounded-lg border min-w-[140px] shadow-sm
        ${isActive ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200" : "border-border bg-card/60 text-muted-foreground"}
        ${selected ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-background" : ""}
      `}
    >
      <div className="font-semibold text-sm truncate" title={d.label}>
        {d.label ?? "Material"}
      </div>
      <div className={`text-[10px] mt-1 flex items-center justify-between ${isActive ? "text-cyan-400" : "text-muted-foreground/80"}`}>
        <span className="font-mono">{d.ontology ?? "—"}</span>
        {isActive && (
          <span className="font-bold uppercase tracking-widest text-[9px] drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">Đang hoạt động</span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { materialNode: MaterialNode };

interface MaterialDagGraphProps {
  nodes: MaterialDagNode[];
  edges: MaterialDagEdge[];
  className?: string;
}

export function MaterialDagGraph({ nodes, edges, className = "" }: MaterialDagGraphProps) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayouted(nodes, edges),
    [nodes, edges]
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setRfNodes(layoutedNodes);
    setRfEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setRfNodes, setRfEdges]);

  const onLayout = useCallback(() => {
    const { nodes: n, edges: e } = getLayouted(nodes, edges);
    setRfNodes(n);
    setRfEdges(e);
  }, [nodes, edges, setRfNodes, setRfEdges]);

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-border bg-card/40 text-muted-foreground font-mono text-sm ${className}`} style={{ minHeight: 400 }}>
        [ NO MATERIALS TO DISPLAY ]
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card/20 overflow-hidden ${className}`} style={{ height: 600 }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--background))" gap={20} />
        <Controls className="fill-muted-foreground stroke-muted-foreground text-muted-foreground !bg-card !border-border bg-opacity-70" />
        <MiniMap
          nodeColor={(n) => (n.data?.lifecycle === "active" ? "#06b6d4" : "hsl(var(--muted))")}
          className="!bg-background !border-border"
          maskColor="inherit"
        />
        <Panel position="top-right" className="flex flex-col gap-3 items-end p-2">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            Đang hoạt động
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border border-border bg-muted" />
              Không hoạt động
            </span>
          </div>
          <button
            type="button"
            onClick={onLayout}
            className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded border border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
          >
            Sắp xếp lại
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
