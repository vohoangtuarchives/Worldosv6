"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertTriangle, GitBranch, Globe, Layers, Zap, MousePointer2 } from "lucide-react";
import { Centrifuge } from "centrifuge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBanner } from "@/components/ui/error-banner";
import dagre from "dagre";
import { useRouter } from "next/navigation";

type UniverseStatus = "active" | "forked" | "merged" | "collapsed";

interface UniverseData {
  id: string;
  label: string;
  sub: string;
  status: UniverseStatus;
  sci: number;
  parentUniverseId?: string | null;
}

interface WorldData {
  id: string;
  label: string;
  sub: string;
  sci: number;
  universes: UniverseData[];
}

interface MultiverseData {
  id: string;
  label: string;
  sub: string;
  worlds: WorldData[];
}

interface PulsedData {
  universe: {
    id: number | string;
    name: string;
    world_id: number | string;
    status?: string;
    structural_coherence?: number;
    current_tick?: number | string;
    parent_universe_id?: number | string | null;
  };
  snapshot?: {
    tick: number | string;
  };
}

const nodeWidth = 260;
const nodeHeight = 120;

/**
 * Dagre layout engine to calculate positions
 */
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) {
      node.targetPosition = Position.Left;
      node.sourcePosition = Position.Right;
      node.position = {
        x: (nodeWithPosition.x ?? 0) - nodeWidth / 2,
        y: (nodeWithPosition.y ?? 0) - nodeHeight / 2,
      };
    }
  });

  return { nodes, edges };
};

/* --- Custom Node Components --- */

const WorldOSNode = ({ data }: { data: { label: string; sub: string } }) => (
  <div className="relative px-6 py-5 min-w-[240px] rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_50px_rgba(34,211,238,0.4)] flex flex-col items-center justify-center overflow-hidden group transition-all duration-300">
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -inset-0.5 bg-cyan-400/20 blur opacity-30 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 bg-cyan-400 border-none shadow-[0_0_15px_#22d3ee]" />

    <div className="flex items-center gap-3 mb-2 relative z-10">
      <Globe size={22} className="text-cyan-400 animate-[spin_10s_linear_infinite]" />
      <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.4em]">WorldOS Core</span>
    </div>
    <div className="text-2xl font-black text-white relative z-10 tracking-tighter">{data.label}</div>
    <div className="text-[10px] text-cyan-400/60 mt-2 uppercase tracking-[0.2em] font-mono relative z-10">{data.sub}</div>
  </div>
);

const WorldNode = ({ data }: { data: { label: string; sub: string; sci: number; count: number } }) => (
  <div className="relative px-5 py-4 min-w-[240px] rounded-xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 hover:border-violet-500/50 hover:bg-zinc-900/60 group">
    <Handle type="target" position={Position.Left} className="!w-2 !h-4 rounded-sm bg-violet-400 border-none" />
    <Handle type="source" position={Position.Right} className="!w-2 !h-4 rounded-sm bg-violet-400 border-none" />

    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-violet-400" />
        <span className="text-[9px] font-black text-violet-300 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
          Domain
        </span>
      </div>
      <Zap size={12} className="text-amber-400 animate-pulse" />
    </div>
    <div className="text-base font-bold text-zinc-100 tracking-tight">{data.label}</div>
    <div className="text-[10px] text-zinc-500 mt-1 font-medium">{data.sub}</div>

    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
      <div className="flex flex-col">
        <span className="text-zinc-500 text-[8px] uppercase font-bold tracking-tighter">Scale</span>
        <span className="text-emerald-400 font-mono text-xs font-bold">{data.count} <span className="text-[8px] opacity-50">UNIV</span></span>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-zinc-500 text-[8px] uppercase font-bold tracking-tighter">Harmony</span>
        <span className="text-amber-400 font-mono text-xs font-bold">{data.sci}</span>
      </div>
    </div>
  </div>
);

const UniverseNode = ({ data }: { data: any }) => {
  const router = useRouter();
  const statusStyles: Record<UniverseStatus, string> = {
    active: "border-blue-500/40 bg-blue-500/5 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    forked: "border-amber-500/40 bg-amber-500/5 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    merged: "border-purple-500/40 bg-purple-500/5 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
    collapsed: "border-red-500/20 bg-red-500/2 text-zinc-500 shadow-none grayscale",
  };

  const status = (data?.status ?? "active") as UniverseStatus;
  const style = statusStyles[status];

  const onSelect = () => {
    if (data.uid) {
      localStorage.setItem("universe_id", data.uid);
      router.push("/dashboard");
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`relative px-4 py-3 min-w-[200px] rounded-lg backdrop-blur-md border ${style} transition-all hover:scale-105 hover:bg-white/5 cursor-pointer group`}
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-3 rounded-sm bg-zinc-600 border-none opacity-50" />
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-3 rounded-sm bg-zinc-600 border-none opacity-50" />

      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <GitBranch size={10} className="opacity-70" />
          <span className="text-[9px] font-mono opacity-60">#{data.uid}</span>
        </div>
        <div className="flex items-center gap-1.5">
           <span className="text-[8px] uppercase font-black tracking-widest">{status}</span>
           <div className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'active' ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      <div className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
        {data.label}
      </div>
      <div className="text-[9px] text-zinc-500 truncate mt-1 flex items-center gap-1">
        <Activity size={8} /> {data.sub}
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
        <div className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">Coherence</div>
        <div className="text-[10px] font-mono font-black text-emerald-400/80">{data.sci}</div>
      </div>
      
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <MousePointer2 size={10} className="text-current rotate-12" />
      </div>
    </div>
  );
};

/* --- Main Logic --- */

const nodeTypes = { worldos: WorldOSNode, world: WorldNode, universe: UniverseNode };

export default function TimelinePage() {
  const [data, setData] = useState<MultiverseData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  // Initial Data Fetch
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(`${apiUrl}/bloom/multiverse`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Tree to Graph Conversion with Dagre
  useEffect(() => {
    if (!data) return;

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // Base Node
    rawNodes.push({
      id: "worldos",
      type: "worldos",
      data: { label: data.label, sub: data.sub },
      position: { x: 0, y: 0 },
    });
    
    if (!data.worlds) return;

    data.worlds.forEach((world) => {
      const worldId = `w-${world.id}`;
      rawNodes.push({
        id: worldId,
        type: "world",
        data: { label: world.label, sub: world.sub, sci: world.sci, count: world.universes.length },
        position: { x: 0, y: 0 },
      });

      rawEdges.push({
        id: `e-os-${worldId}`,
        source: "worldos",
        target: worldId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#06b6d4", strokeWidth: 2, opacity: 0.6 },
      });

      world.universes.forEach((u) => {
        rawNodes.push({
          id: u.id,
          type: "universe",
          data: { uid: u.id, label: u.label, sub: u.sub, status: u.status, sci: u.sci },
          position: { x: 0, y: 0 },
        });

        if (!u.parentUniverseId) {
          rawEdges.push({
            id: `e-${worldId}-${u.id}`,
            source: worldId,
            target: u.id,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#8b5cf6", strokeWidth: 2, opacity: 0.5 },
          });
        } else {
          rawEdges.push({
            id: `e-${u.parentUniverseId}-${u.id}`,
            source: u.parentUniverseId,
            target: u.id,
            type: "smoothstep",
            animated: true,
            label: "FORK",
            labelStyle: { fill: "#eab308", fontSize: 9, fontWeight: "800", opacity: 0.8 },
            style: { stroke: "#eab308", strokeWidth: 1.5, strokeDasharray: "4,4", opacity: 0.8 },
          });
        }
      });
    });

    const layouted = getLayoutedElements(rawNodes, rawEdges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [data, setNodes, setEdges]);

  // Centrifuge Bridge (WS)
  useEffect(() => {
     if (typeof window === "undefined") return;
     const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
     const centrifuge = new Centrifuge(`${protocol}//${window.location.host}/connection/websocket`);
     const sub = centrifuge.newSubscription("public:universes");

     sub.on("publication", (ctx) => {
        const pulsed = ctx.data as PulsedData;
        if (!pulsed?.universe) return;
                setData(prev => {
            if (!prev || !prev.worlds) return prev;
            const newWorlds = prev.worlds.map(w => {
                if (String(w.id) !== String(pulsed.universe.world_id)) return w;
                const existingIdx = w.universes.findIndex(u => u.id === String(pulsed.universe.id));
                const nextUni = {
                    id: String(pulsed.universe.id),
                    label: pulsed.universe.name,
                    sub: `Tick #${pulsed.snapshot?.tick ?? pulsed.universe.current_tick}`,
                    status: (pulsed.universe.status || "active") as UniverseStatus,
                    sci: Math.round(pulsed.universe.structural_coherence || 0),
                    parentUniverseId: pulsed.universe.parent_universe_id ? String(pulsed.universe.parent_universe_id) : null
                };

                if (existingIdx > -1) {
                    const nextUnis = [...w.universes];
                    nextUnis[existingIdx] = nextUni;
                    return { ...w, universes: nextUnis };
                } else {
                    return { ...w, universes: [...w.universes, nextUni] };
                }
            });
            return { ...prev, worlds: newWorlds };
        });
     });

     sub.subscribe();
     centrifuge.connect();
     return () => centrifuge.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" className="text-cyan-400 mb-6" />
        <div className="flex flex-col items-center gap-1">
           <h2 className="text-sm font-black uppercase tracking-[0.5em] text-cyan-400/80">Harmonizing</h2>
           <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Đang khởi tạo liên kết đa vũ trụ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">Sync Error</h2>
        <ErrorBanner message={error} />
      </div>
    );
  }

   return (
    <div className="w-full h-screen min-h-[600px] bg-zinc-950 relative">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center border border-cyan-400/30">
               <GitBranch className="text-cyan-400" />
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tighter text-white">Timeline Đa Vũ Trụ</h1>
               <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold">Causal Topology Visualizer</p>
            </div>
         </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypesMemo}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background gap={30} size={1} color="#333" className="opacity-20" />
        <Controls className="bg-zinc-900 border-white/5" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "worldos") return "#22d3ee";
            if (n.type === "world") return "#8b5cf6";
            const status = (n.data as any)?.status;
            if (status === "forked") return "#f59e0b";
            if (status === "collapsed") return "#ef4444";
            return "#3b82f6";
          }}
          maskColor="rgba(0,0,0,0.8)"
          style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.05)" }}
        />
      </ReactFlow>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/5 text-[10px] text-zinc-400 flex items-center gap-8 shadow-2xl">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="uppercase font-bold tracking-widest">Core</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
            <span className="uppercase font-bold tracking-widest">World</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            <span className="uppercase font-bold tracking-widest">Universe</span>
         </div>
         <div className="w-px h-4 bg-white/10" />
         <div className="italic opacity-60">Tip: Click vào một Universe để chuyển đến Bảng điều khiển.</div>
      </div>
    </div>
  );
}

// Support Icons
const Activity = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        width={size} height={size} viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
        className={className}
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
