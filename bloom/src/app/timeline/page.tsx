"use client";

import { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Position,
    Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Globe, Layers, GitBranch, Loader2, AlertTriangle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface UniverseData {
    id: string;
    label: string;
    sub: string;
    status: 'active' | 'forked' | 'merged' | 'collapsed';
    sci: number;
    parentUniverseId?: string | null; // for branching within a World
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

// ─────────────────────────────────────────────────────────────────────────────
// AUTO LAYOUT ENGINE
// Column X positions (horizontal hierarchy)
// Each World gets a vertical "block" proportional to its universe count
// Universes are evenly distributed within their block
// ─────────────────────────────────────────────────────────────────────────────
const COL = { root: 50, world: 320, universe: 620, branch: 930 };
const ROW_H = 140;  // height per universe slot
const GAP = 60;     // vertical gap between worlds

function buildGraph(data: MultiverseData): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate total height needed to center WorldOS
    let totalSlots = 0;
    const worldOffsets: number[] = [];

    data.worlds.forEach((w) => {
        worldOffsets.push(totalSlots);
        const directUniverses = w.universes.filter(u => !u.parentUniverseId);
        totalSlots += directUniverses.length;
        if (data.worlds.indexOf(w) < data.worlds.length - 1) totalSlots += GAP / ROW_H;
    });

    const totalHeight = totalSlots * ROW_H;
    const rootY = totalHeight / 2 - 40;

    // ── WorldOS Root ──
    nodes.push({
        id: data.id,
        type: 'worldos',
        position: { x: COL.root, y: rootY },
        data: { label: data.label, sub: data.sub },
    });

    let currentY = 0;

    data.worlds.forEach((world) => {
        const directUniverses = world.universes.filter(u => !u.parentUniverseId);
        // Default to a minimum height of 1 slot even if empty
        const effectiveSlots = directUniverses.length > 0 ? directUniverses.length : 1;
        const blockHeight = effectiveSlots * ROW_H;
        const worldCenterY = currentY + blockHeight / 2 - 40;

        // ── World node ──
        nodes.push({
            id: world.id,
            type: 'world',
            position: { x: COL.world, y: worldCenterY },
            data: { label: world.label, sub: world.sub, sci: world.sci, count: world.universes.length },
        });

        edges.push({
            id: `e-root-${world.id}`,
            source: data.id,
            target: world.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#7c3aed', strokeWidth: 2 },
        });

        // ── Direct universes ──
        directUniverses.forEach((u, uIdx) => {
            const uY = currentY + uIdx * ROW_H + 10;

            nodes.push({
                id: u.id,
                type: 'universe',
                position: { x: COL.universe, y: uY },
                data: { uid: u.id, label: u.label, sub: u.sub, status: u.status, sci: u.sci },
            });

            edges.push({
                id: `e-${world.id}-${u.id}`,
                source: world.id,
                target: u.id,
                type: 'smoothstep',
                animated: true,
                style: {
                    stroke: u.status === 'forked' ? '#eab308' : u.status === 'merged' ? '#a855f7' : '#3b82f6',
                    strokeWidth: 2,
                    strokeDasharray: u.status === 'forked' ? '5,5' : undefined,
                    filter: u.status === 'forked' ? 'drop-shadow(0 0 5px rgba(234,179,8,0.8))' :
                        u.status === 'merged' ? 'drop-shadow(0 0 5px rgba(168,85,247,0.8))' :
                            'drop-shadow(0 0 5px rgba(59,130,246,0.8))'
                },
            });

            // ── Branch universes (children of this universe) ──
            const branches = world.universes.filter(b => b.parentUniverseId === u.id);
            branches.forEach((b, bIdx) => {
                nodes.push({
                    id: b.id,
                    type: 'universe',
                    position: { x: COL.branch, y: uY + bIdx * ROW_H },
                    data: { uid: b.id, label: b.label, sub: b.sub, status: b.status, sci: b.sci },
                });

                edges.push({
                    id: `e-${u.id}-${b.id}`,
                    source: u.id,
                    target: b.id,
                    type: 'smoothstep',
                    animated: true,
                    label: 'FORK',
                    labelStyle: { fill: '#eab308', fontSize: 10, fontWeight: 'bold' },
                    style: {
                        stroke: '#eab308',
                        strokeWidth: 2,
                        strokeDasharray: '5,5',
                        filter: 'drop-shadow(0 0 5px rgba(234,179,8,0.8))'
                    },
                });
            });
        });

        currentY += blockHeight + GAP;
    });

    return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// NODE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const WorldOSNode = ({ data }: { data: any }) => (
    <div className="relative px-6 py-5 min-w-[220px] rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_40px_rgba(34,211,238,0.5)] flex flex-col items-center justify-center overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(34,211,238,0.7)]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-400 border-none shadow-[0_0_10px_#22d3ee]" />

        <div className="flex items-center gap-3 mb-2">
            <Globe size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em]">WorldOS</span>
        </div>
        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
            {data.label}
        </div>
        <div className="text-[10px] text-cyan-400/60 mt-2 uppercase tracking-[0.2em] font-mono">{data.sub}</div>
    </div>
);

const WorldNode = ({ data }: { data: any }) => (
    <div className="relative px-5 py-4 min-w-[240px] rounded-xl bg-zinc-900/90 backdrop-blur-sm border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] hover:border-violet-400 group">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent rounded-xl pointer-events-none" />
        <Handle type="target" position={Position.Left} className="w-2 h-4 rounded-sm bg-violet-400 border-none shadow-[0_0_8px_#a78bfa]" />
        <Handle type="source" position={Position.Right} className="w-2 h-4 rounded-sm bg-violet-400 border-none shadow-[0_0_8px_#a78bfa]" />

        <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-violet-400" />
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/30">World</span>
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

const UniverseNode = ({ data }: { data: any }) => {
    const styles: Record<string, { border: string, bg: string, text: string, shadow: string, glow: string }> = {
        active: { border: 'border-blue-500/50', bg: 'bg-blue-950/20', text: 'text-blue-400', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', glow: 'bg-blue-400' },
        forked: { border: 'border-yellow-500/50', bg: 'bg-yellow-950/20', text: 'text-yellow-400', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]', glow: 'bg-yellow-400' },
        merged: { border: 'border-purple-500/50', bg: 'bg-purple-950/20', text: 'text-purple-400', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]', glow: 'bg-purple-400' },
        collapsed: { border: 'border-red-500/30', bg: 'bg-red-950/10', text: 'text-red-400/70', shadow: 'shadow-[0_0_5px_rgba(239,68,68,0.1)]', glow: 'bg-red-400/50' },
    };

    const curr = styles[data.status] ?? { border: 'border-zinc-600', bg: 'bg-zinc-900', text: 'text-zinc-500', shadow: '', glow: 'bg-zinc-500' };

    return (
        <div className={`relative px-4 py-3 min-w-[200px] rounded-lg backdrop-blur-md border ${curr.border} ${curr.bg} ${curr.shadow} transition-transform hover:scale-105 group overflow-hidden`}>
            {/* Edge Handles */}
            <Handle type="target" position={Position.Left} className={`w-1.5 h-3 rounded bg-zinc-700 border-none ${data.status !== 'collapsed' ? `group-hover:${curr.glow} group-hover:shadow-[0_0_6px_currentColor]` : ''}`} />
            <Handle type="source" position={Position.Right} className={`w-1.5 h-3 rounded bg-zinc-700 border-none ${data.status !== 'collapsed' ? `group-hover:${curr.glow} group-hover:shadow-[0_0_6px_currentColor]` : ''}`} />

            {/* Status indicator line */}
            <div className={`absolute top-0 left-0 w-1 h-full ${curr.glow} opacity-60`} />

            <div className="flex items-center justify-between gap-1 mb-2 pl-2">
                <div className="flex items-center gap-1.5">
                    <GitBranch size={12} className={curr.text} />
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider">#{data.uid}</span>
                </div>
                <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${curr.border} ${curr.text}`}>
                    {data.status}
                </span>
            </div>

            <div className="pl-2">
                <div className="text-sm font-bold text-zinc-200 truncate" title={data.label}>{data.label}</div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{data.sub}</div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-800/50 pl-2">
                <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-zinc-500 uppercase tracking-widest">SCI</span>
                    <span className="text-emerald-400 font-mono font-bold">{data.sci}</span>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = { worldos: WorldOSNode, world: WorldNode, universe: UniverseNode };

// ─────────────────────────────────────────────────────────────────────────────
// RECURSIVE LAYOUT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const COL_SPACING = 300;
const ROW_SPACING = 150;

function buildGraphRecursive(data: MultiverseData): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Root WorldOS
    nodes.push({
        id: 'worldos',
        type: 'worldos',
        position: { x: 0, y: 0 },
        data: { label: data.label, sub: data.sub },
    });

    let currentWorldY = 0;

    data.worlds.forEach((world, wIdx) => {
        // 2. World Nodes
        const worldId = `w-${world.id}`;
        nodes.push({
            id: worldId,
            type: 'world',
            position: { x: COL_SPACING, y: currentWorldY },
            data: { label: world.label, sub: world.sub, sci: world.sci, count: world.universes.length },
        });

        edges.push({
            id: `e-os-${worldId}`,
            source: 'worldos',
            target: worldId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#06b6d4', strokeWidth: 2 },
        });

        // 3. Universe Tree (Recursive)
        const roots = world.universes.filter(u => !u.parentUniverseId);
        let worldHeight = 0;

        const processUniverse = (u: UniverseData, x: number, y: number): number => {
            nodes.push({
                id: u.id,
                type: 'universe',
                position: { x, y },
                data: { uid: u.id, label: u.label, sub: u.sub, status: u.status, sci: u.sci },
            });

            const children = world.universes.filter(c => c.parentUniverseId === u.id);
            if (children.length === 0) return ROW_SPACING;

            let totalChildHeight = 0;
            children.forEach((child, cIdx) => {
                const childY = y + totalChildHeight;
                totalChildHeight += processUniverse(child, x + COL_SPACING, childY);

                edges.push({
                    id: `e-${u.id}-${child.id}`,
                    source: u.id,
                    target: child.id,
                    type: 'smoothstep',
                    animated: true,
                    label: 'FORK',
                    labelStyle: { fill: '#eab308', fontSize: 10, fontWeight: 'bold' },
                    style: { stroke: '#eab308', strokeWidth: 2, strokeDasharray: '5,5' },
                });
            });

            return totalChildHeight;
        };

        let universeYOffset = currentWorldY;
        roots.forEach(root => {
            const h = processUniverse(root, COL_SPACING * 2, universeYOffset);

            edges.push({
                id: `e-${worldId}-${root.id}`,
                source: worldId,
                target: root.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 2 },
            });

            universeYOffset += h;
            worldHeight += h;
        });

        currentWorldY += Math.max(worldHeight, ROW_SPACING) + 50;
    });

    return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
// @ts-ignore
import { Centrifuge } from 'centrifuge';

export default function SacredTimeline() {
    const nodeTypesMemo = useMemo(() => nodeTypes, []);
    const [data, setData] = useState<MultiverseData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

        // 1. Initial Fetch
        fetch(`${apiUrl}/bloom/multiverse`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                return res.json();
            })
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch multiverse data:", err);
                setError(err.message);
                setLoading(false);
            });

        // 2. Real-time Subscription via Centrifugo
        // Port 80 /connection/websocket defined in Nginx
        const centrifuge = new Centrifuge(`ws://${window.location.host}/connection/websocket`);

        centrifuge.on('connected', (ctx: any) => {
            console.log('Centrifugo connected', ctx);
        });

        const sub = centrifuge.newSubscription('public:universes');

        sub.on('publication', (ctx: any) => {
            console.log('Pulsed event received:', ctx.data);
            const pulsed = ctx.data; // { universe: {...}, snapshot: {...} }

            if (pulsed && pulsed.universe) {
                setData(prev => {
                    if (!prev) return prev;

                    const newWorlds = prev.worlds.map(w => {
                        if (w.id == pulsed.universe.world_id) {
                            const universeExists = w.universes.some(u => u.id == pulsed.universe.id);

                            const updatedUniverses = universeExists
                                ? w.universes.map(u => u.id == pulsed.universe.id ? {
                                    ...u,
                                    sub: `Tick #${pulsed.snapshot.tick}`,
                                    sci: Math.round(pulsed.universe.structural_coherence),
                                    status: pulsed.universe.status
                                } : u)
                                : [...w.universes, {
                                    id: String(pulsed.universe.id),
                                    label: pulsed.universe.name,
                                    sub: `Tick #${pulsed.snapshot.tick}`,
                                    status: pulsed.universe.status || 'active',
                                    sci: Math.round(pulsed.universe.structural_coherence),
                                    parentUniverseId: pulsed.universe.parent_universe_id ? String(pulsed.universe.parent_universe_id) : null
                                }];

                            return { ...w, universes: updatedUniverses };
                        }
                        return w;
                    });

                    return { ...prev, worlds: newWorlds };
                });
            }
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
            <div className="w-screen h-screen bg-[#09090b] flex flex-col items-center justify-center font-mono text-cyan-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-cyan-500" />
                <p className="tracking-widest uppercase opacity-80 text-sm">Resonating with WorldOS Core...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-screen h-screen bg-[#09090b] flex flex-col items-center justify-center font-mono text-red-500">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">Sync Failure</h2>
                <p className="text-sm opacity-80">Failed to establish dimensional tether: {error}</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={graphData.nodes}
                edges={graphData.edges}
                nodeTypes={nodeTypesMemo}
                fitView
                fitViewOptions={{ padding: 0.15 }}
            >
                <Background gap={24} size={1} color="#222" style={{ background: 'transparent' }} />
                <Controls style={{ background: '#18181b', border: '1px solid #333' }} />
                <MiniMap
                    nodeColor={(n) =>
                        n.type === 'worldos' ? '#22d3ee' :
                            n.type === 'world' ? '#8b5cf6' :
                                n.data?.status === 'forked' ? '#eab308' :
                                    n.data?.status === 'merged' ? '#a855f7' : '#3b82f6'
                    }
                    maskColor="rgba(0,0,0,0.75)"
                    style={{ background: '#18181b' }}
                />
            </ReactFlow>
        </div>
    );
}
