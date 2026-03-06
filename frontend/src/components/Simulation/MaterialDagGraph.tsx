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
        px-3 py-2 rounded-lg border-2 min-w-[140px] shadow-md
        ${isActive ? "border-emerald-500 bg-emerald-500/10" : "border-slate-600 bg-slate-800/80"}
        ${selected ? "ring-2 ring-amber-400" : ""}
      `}
    >
      <div className="font-semibold text-sm text-slate-100 truncate" title={d.label}>
        {d.label ?? "Material"}
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
        <span>{d.ontology ?? "—"}</span>
        {isActive && (
          <span className="text-emerald-400 font-medium uppercase tracking-wider">Active</span>
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
      <div className={`flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 text-slate-500 ${className}`} style={{ minHeight: 400 }}>
        No materials to display.
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden ${className}`} style={{ height: 500 }}>
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
        <Background color="rgb(71 85 105)" gap={16} />
        <Controls />
        <MiniMap nodeColor={(n) => (n.data?.lifecycle === "active" ? "#10b981" : "#475569")} />
        <Panel position="top-right" className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border-2 border-emerald-500 bg-emerald-500/10" />
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border-2 border-slate-600 bg-slate-800/80" />
              Inactive
            </span>
          </div>
          <button
            type="button"
            onClick={onLayout}
            className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Re-layout
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
