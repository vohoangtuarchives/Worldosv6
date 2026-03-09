"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  Position,
  Handle,
} from "@xyflow/react";
import { AlertTriangle, GitBranch, Globe, Layers } from "lucide-react";
import { Centrifuge } from "centrifuge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBanner } from "@/components/ui/error-banner";

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

const COL_SPACING = 300;
const ROW_SPACING = 150;

function buildGraphRecursive(data: MultiverseData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: "worldos",
    type: "worldos",
    position: { x: 0, y: 0 },
    data: { label: data.label, sub: data.sub },
  });

  let currentWorldY = 0;

  data.worlds.forEach((world) => {
    const worldId = `w-${world.id}`;
    nodes.push({
      id: worldId,
      type: "world",
      position: { x: COL_SPACING, y: currentWorldY },
      data: { label: world.label, sub: world.sub, sci: world.sci, count: world.universes.length },
    });

    edges.push({
      id: `e-os-${worldId}`,
      source: "worldos",
      target: worldId,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#06b6d4", strokeWidth: 2 },
    });

    const roots = world.universes.filter((u) => !u.parentUniverseId);
    let worldHeight = 0;

    const processUniverse = (u: UniverseData, x: number, y: number): number => {
      nodes.push({
        id: u.id,
        type: "universe",
        position: { x, y },
        data: { uid: u.id, label: u.label, sub: u.sub, status: u.status, sci: u.sci },
      });

      const children = world.universes.filter((c) => c.parentUniverseId === u.id);
      if (children.length === 0) return ROW_SPACING;

      let totalChildHeight = 0;
      children.forEach((child) => {
        const childY = y + totalChildHeight;
        totalChildHeight += processUniverse(child, x + COL_SPACING, childY);

        edges.push({
          id: `e-${u.id}-${child.id}`,
          source: u.id,
          target: child.id,
          type: "smoothstep",
          animated: true,
          label: "FORK",
          labelStyle: { fill: "#eab308", fontSize: 10, fontWeight: "bold" },
          style: { stroke: "#eab308", strokeWidth: 2, strokeDasharray: "5,5" },
        });
      });

      return totalChildHeight;
    };

    let universeYOffset = currentWorldY;
    roots.forEach((root) => {
      const h = processUniverse(root, COL_SPACING * 2, universeYOffset);

      edges.push({
        id: `e-${worldId}-${root.id}`,
        source: worldId,
        target: root.id,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
      });

      universeYOffset += h;
      worldHeight += h;
    });

    currentWorldY += Math.max(worldHeight, ROW_SPACING) + 50;
  });

  return { nodes, edges };
}

const WorldOSNode = ({ data }: { data: { label: string; sub: string } }) => (
  <div className="relative px-6 py-5 min-w-[220px] rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_40px_rgba(34,211,238,0.5)] flex flex-col items-center justify-center overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(34,211,238,0.7)]">
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-400 border-none shadow-[0_0_10px_#22d3ee]" />

    <div className="flex items-center gap-3 mb-2">
      <Globe size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      <span className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em]">WorldOS</span>
    </div>
    <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">{data.label}</div>
    <div className="text-[10px] text-cyan-400/60 mt-2 uppercase tracking-[0.2em] font-mono">{data.sub}</div>
  </div>
);

const WorldNode = ({ data }: { data: { label: string; sub: string; sci: number; count: number } }) => (
  <div className="relative px-5 py-4 min-w-[240px] rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] hover:border-violet-400 group">
    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent rounded-xl pointer-events-none" />
    <Handle type="target" position={Position.Left} className="w-2 h-4 rounded-sm bg-violet-400 border-none shadow-[0_0_8px_#a78bfa]" />
    <Handle type="source" position={Position.Right} className="w-2 h-4 rounded-sm bg-violet-400 border-none shadow-[0_0_8px_#a78bfa]" />

    <div className="flex items-center gap-2 mb-2">
      <Layers size={16} className="text-violet-400" />
      <span className="text-[11px] font-bold text-violet-300 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/30">
        World
      </span>
    </div>
    <div className="text-lg font-bold text-zinc-100">{data.label}</div>
    <div className="text-[11px] text-zinc-500 mt-0.5">{data.sub}</div>

    <div className="flex justify-between items-center mt-4 pt-3 border-t border-violet-500/20 text-xs">
      <div className="flex flex-col">
        <span className="text-zinc-500 text-[9px] uppercase tracking-wider">Universes</span>
        <span className="text-emerald-400 font-mono font-semibold">{data.count}</span>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-zinc-500 text-[9px] uppercase tracking-wider">Average SCI</span>
        <span className="text-amber-400 font-mono font-semibold">{data.sci}</span>
      </div>
    </div>
  </div>
);

type UniverseNodeData = { uid?: string; label?: string; sub?: string; status?: UniverseStatus; sci?: number };

const UniverseNode = ({ data }: { data: UniverseNodeData }) => {
  const styles: Record<
    UniverseStatus,
    { border: string; bg: string; text: string; shadow: string; glow: string }
  > = {
    active: {
      border: "border-blue-500/50",
      bg: "bg-blue-950/20",
      text: "text-blue-400",
      shadow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      glow: "bg-blue-400",
    },
    forked: {
      border: "border-yellow-500/50",
      bg: "bg-yellow-950/20",
      text: "text-yellow-400",
      shadow: "shadow-[0_0_15px_rgba(234,179,8,0.2)]",
      glow: "bg-yellow-400",
    },
    merged: {
      border: "border-purple-500/50",
      bg: "bg-purple-950/20",
      text: "text-purple-400",
      shadow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
      glow: "bg-purple-400",
    },
    collapsed: {
      border: "border-red-500/30",
      bg: "bg-red-950/10",
      text: "text-red-400/70",
      shadow: "shadow-[0_0_5px_rgba(239,68,68,0.1)]",
      glow: "bg-red-400/50",
    },
  };

  const status = (data?.status ?? "active") as UniverseStatus;
  const curr = styles[status] ?? styles.active;

  return (
    <div
      className={`relative px-4 py-3 min-w-[200px] rounded-lg backdrop-blur-md border ${curr.border} ${curr.bg} ${curr.shadow} transition-transform hover:scale-105 group overflow-hidden`}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-3 rounded bg-zinc-700 border-none" />
      <Handle type="source" position={Position.Right} className="w-1.5 h-3 rounded bg-zinc-700 border-none" />

      <div className={`absolute top-0 left-0 w-1 h-full ${curr.glow} opacity-60`} />

      <div className="flex items-center justify-between gap-1 mb-2 pl-2">
        <div className="flex items-center gap-1.5">
          <GitBranch size={12} className={curr.text} />
          <span className="text-[10px] text-zinc-400 font-mono tracking-wider">#{data.uid ?? "?"}</span>
        </div>
        <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${curr.border} ${curr.text}`}>
          {status}
        </span>
      </div>

      <div className="pl-2">
        <div className="text-sm font-bold text-zinc-200 truncate" title={data.label}>
          {data.label ?? "Universe"}
        </div>
        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{data.sub ?? ""}</div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-800/50 pl-2">
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-zinc-500 uppercase tracking-widest">SCI</span>
          <span className="text-emerald-400 font-mono font-bold">{data.sci ?? 0}</span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { worldos: WorldOSNode, world: WorldNode, universe: UniverseNode };

export default function TimelinePage() {
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const [data, setData] = useState<MultiverseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

    const centrifuge = new Centrifuge(`ws://${window.location.host}/connection/websocket`);
    const sub = centrifuge.newSubscription("public:universes");

    sub.on("publication", (ctx: { data?: any }) => {
      const pulsed = ctx.data;
      if (!pulsed?.universe) return;
      setData((prev) => {
        if (!prev) return prev;
        const newWorlds = prev.worlds.map((w) => {
          if (String(w.id) !== String(pulsed.universe.world_id)) return w;
          const universeExists = w.universes.some((u) => String(u.id) === String(pulsed.universe.id));
          const nextUniverse: UniverseData = {
            id: String(pulsed.universe.id),
            label: pulsed.universe.name,
            sub: `Tick #${pulsed.snapshot?.tick ?? "?"}`,
            status: (pulsed.universe.status || "active") as UniverseStatus,
            sci: Math.round(pulsed.universe.structural_coherence || 0),
            parentUniverseId: pulsed.universe.parent_universe_id ? String(pulsed.universe.parent_universe_id) : null,
          };
          const updatedUniverses = universeExists
            ? w.universes.map((u) => (String(u.id) === String(nextUniverse.id) ? { ...u, ...nextUniverse } : u))
            : [...w.universes, nextUniverse];
          return { ...w, universes: updatedUniverses };
        });
        return { ...prev, worlds: newWorlds };
      });
    });

    sub.subscribe();
    centrifuge.connect();

    return () => {
      centrifuge.disconnect();
    };
  }, []);

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return buildGraphRecursive(data);
  }, [data]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-background flex flex-col items-center justify-center font-mono text-foreground">
        <LoadingSpinner size="lg" className="mb-4 text-primary" />
        <p className="tracking-widest uppercase opacity-80 text-sm text-muted-foreground">Đang cộng hưởng với WorldOS Core...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-4">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertTriangle className="w-12 h-12" />
            <h2 className="text-xl font-bold uppercase tracking-wide">Đồng bộ thất bại</h2>
          </div>
          <ErrorBanner message={`Không thiết lập được liên kết chiều: ${error}`} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow nodes={graphData.nodes} edges={graphData.edges} nodeTypes={nodeTypesMemo} fitView fitViewOptions={{ padding: 0.15 }}>
        <Background gap={24} size={1} color="#222" style={{ background: "transparent" }} />
        <Controls style={{ background: "#18181b", border: "1px solid #333" }} />
        <MiniMap
          nodeColor={(n) =>
            n.type === "worldos"
              ? "#22d3ee"
              : n.type === "world"
                ? "#8b5cf6"
                : (n.data as any)?.status === "forked"
                  ? "#eab308"
                  : (n.data as any)?.status === "merged"
                    ? "#a855f7"
                    : "#3b82f6"
          }
          maskColor="rgba(0,0,0,0.75)"
          style={{ background: "#18181b" }}
        />
      </ReactFlow>
    </div>
  );
}
