"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    Users, Shield, Zap, Star, Eye, ChevronRight, User, Repeat, Orbit,
    Search, Filter, Skull, HeartPulse, BrainCircuit, Sparkles, Clock, MessageSquare, History as HistoryIcon
} from "lucide-react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    ResponsiveContainer
} from 'recharts';
import { useSimulation } from "@/context/SimulationContext";
import { api } from "@/lib/api";
import { SamsaraPath } from "./SamsaraPath";
import { AttractorMandala } from "./AttractorMandala";
import type { ActorEvent } from "@/types/simulation";

interface Actor {
    id: number;
    name: string;
    archetype: string;
    traits: number[];
    biography: string;
    is_alive: boolean;
    metrics?: { influence?: number; energy?: number; contribution?: number; reasoning?: string };
    generation?: number;
    universe_id?: number;
    lineage_id?: string | null;
    parent_actor_id?: number | null;
    birth_tick?: number | null;
    death_tick?: number | null;
    life_stage?: string | null;
    trait_scan_status?: string | null;
    /** V7: Dynasty and Heroic info */
    dynasty?: string | null;
    heroic_type?: string | null;
    heroic_class?: string | null;
    lineage_name?: string | null;
    vitality?: { health?: number; age?: number; fatigue?: number; morale?: number } | null;
    updated_at?: string;
    /** When set, this actor is a Great Person (vĩ nhân) linked to SupremeEntity. */
    supreme_entity?: { id: number; name?: string; entity_type?: string; domain?: string } | null;
    is_transmigrated?: boolean | number;
    is_isekai?: boolean | number;
}

const TRAIT_DIMENSIONS = [
    "Thống trị",    // 0
    "Tham vọng",     // 1
    "Ép buộc",      // 2
    "Trung thành",     // 3
    "Thấu cảm",      // 4
    "Đoàn kết",    // 5
    "Tuân thủ",   // 6
    "Thực dụng",    // 7
    "Tò mò",     // 8
    "Giáo điều",     // 9
    "Mạo hiểm", // 10
    "Sợ hãi",         // 11
    "Hận thù",     // 12
    "Hy vọng",          // 13
    "Đau thương",         // 14
    "Kiêu hãnh",         // 15
    "Hổ thẹn",         // 16
    "Tuổi thọ"      // 17
];

function getTypeLabel(entityType: string): string {
    const key = (entityType || "").toUpperCase().replace(/^GREAT_PERSON_/, "");
    const labels: Record<string, string> = {
        PROPHET: "Thánh Nhân",
        GENERAL: "Đại Tướng Quân",
        SCIENTIST: "Học Giả Vĩ Đại",
        RULER: "Minh Quân",
        MERCHANT: "Đại Phú Hộ",
        ARTIST: "Đại Nghệ Sĩ",
    };
    return labels[key] ?? entityType;
}

/** Cognition proxy from cognitive block (Pra, Cur, Dog, Rsk — indices 7–10). */
function cognitionLabel(traits: number[]): string {
    if (!traits?.length) return "—";
    const cognitive = [traits[7], traits[8], traits[9], traits[10]].filter((v) => v != null);
    if (cognitive.length === 0) return "—";
    const avg = cognitive.reduce((a, b) => a + b, 0) / cognitive.length;
    if (avg >= 0.6) return "Cao";
    if (avg >= 0.3) return "Trung bình";
    if (avg > 0) return "Thấp";
    return "—";
}

function ActorRadarChart({ traits }: { traits: number[] }) {
    const data = useMemo(() => {
        const arr = TRAIT_DIMENSIONS.map((label, i) => ({
            subject: label,
            A: Math.max(0.02, traits[i] ?? 0),
            fullMark: 1.0,
        }));
        return arr;
    }, [traits]);
    const hasData = (traits?.length && traits.some((v) => (v ?? 0) > 0)) ?? false;

    return (
        <div className="h-[220px] w-full mt-4 bg-slate-900/40 rounded-xl p-2 border border-slate-800 relative overflow-hidden">
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/60 rounded-xl">
                    <span className="text-xs text-slate-500 font-mono">Chưa có dữ liệu scan 17-D</span>
                </div>
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 to-transparent pointer-events-none" />
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#1e293b" strokeOpacity={0.8} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
                    />
                    <Radar
                        name="Traits"
                        dataKey="A"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="#06b6d4"
                        fillOpacity={hasData ? 0.2 : 0.08}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

function deriveMotivations(traits: number[]) {
    if (!traits || traits.length < 17) {
        return {
            survival: 0.5, reproduction: 0.5, wealth: 0.5, power: 0.5,
            knowledge: 0.5, meaning: 0.5, status: 0.5, belonging: 0.5
        };
    }
    const get = (idx: number) => traits[idx] ?? 0.5;
    
    return {
        survival: get(17), // Vitality/Longevity as proxy
        reproduction: get(17) * 0.8 + get(4) * 0.2, // Vitality + Empathy
        wealth: get(7) * 0.7 + get(1) * 0.3, // Pragmatism + Ambition
        power: get(0) * 0.6 + get(2) * 0.4, // Dominance + Coercion
        knowledge: get(8), // Curiosity
        meaning: get(13) * 0.7 + (1 - get(9)) * 0.3, // Hope + (1 - Dogmatism)
        status: get(15) * 0.8 + get(0) * 0.2, // Pride + Dominance
        belonging: get(5) * 0.4 + get(6) * 0.3 + get(3) * 0.3, // Solidarity + Conformity + Loyalty
    };
}

function ActorBiography({ text }: { text: string }) {
    if (!text || !text.trim()) return (
        <div className="space-y-1">
            <p className="text-slate-500 italic text-sm">Chưa có sự kiện nào được ghi nhận cho nhân vật này.</p>
            <p className="text-slate-600 text-xs">Biên niên sử sẽ cập nhật khi simulation ghi nhận hành động hoặc sự kiện liên quan.</p>
        </div>
    );

    // Regex to capture pattern: " - T<digits>: " or "- T<digits>: "
    // This splits the string but keeps the delimiter parts (T<digits>) in the array
    const parts = text.split(/[-–]\s*T(\d+):/g);

    // If no match found (length 1), it's just a normal paragraph
    if (parts.length === 1) {
        return (
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {text}
            </div>
        );
    }

    const timeline: { tick: string, content: string }[] = [];

    // parts[0] is the preamble (text before the first Txx)
    if (parts[0].trim()) {
        timeline.push({ tick: "ORIGIN", content: parts[0].trim() });
    }

    // The split with capturing group (d+) results in: [preamble, tick1, content1, tick2, content2...]
    for (let i = 1; i < parts.length; i += 2) {
        const tickVal = parts[i];       // e.g. "77"
        const contentVal = parts[i + 1];  // e.g. "Rời bỏ chốn cũ..."

        if (tickVal && contentVal) {
            timeline.push({
                tick: `T${tickVal}`,
                content: contentVal.trim().replace(/^[-–]/, '').trim() // Clean up any leading dash residue
            });
        }
    }

    return (
        <div className="space-y-6">
            {timeline.map((entry, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-700/50 hover:border-cyan-500/50 transition-colors group">
                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-slate-600 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 transition-all shadow-sm group-hover:shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/30 px-2 py-0.5 rounded w-fit border border-cyan-500/20 shadow-sm">
                            {entry.tick}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {entry.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ActorList({ universeId: _unused }: { universeId?: number | null }) {
    const { actors, loading: contextLoading } = useSimulation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "alive" | "dead">("all");
    const [showSamsaraId, setShowSamsaraId] = useState<number | null>(null);

    const loading = contextLoading && actors.length === 0;

    // Filter actors
    const filteredActors = useMemo(() => {
        return actors.filter(actor => {
            const matchesSearch = actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                actor.archetype.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === "all"
                ? true
                : filterStatus === "alive" ? actor.is_alive : !actor.is_alive;
            return matchesSearch && matchesStatus;
        });
    }, [actors, searchQuery, filterStatus]);

    const handleActorClick = (id: number) => {
        // We use router.push to trigger the Parallel Route @modal/(.)actor/[id]
        router.push(`/dashboard/actor/${id}`, { scroll: false });
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Actors...</p>
            </div>
        );
    }

    if (actors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-slate-600">
                <div className="w-24 h-24 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800 shadow-inner">
                    <Eye className="w-10 h-10 opacity-30" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-slate-400">Chưa có Actor hiện hữu</p>
                    <p className="text-sm opacity-60 max-w-xs mx-auto">Sân khấu trống. Pulse world để kích hoạt nhân quả và sinh linh.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-950/40 rounded-2xl border border-slate-800/50 backdrop-blur-md">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-800/50 space-y-3 bg-slate-900/30">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-500" />
                        Danh sách Thực thể ({filteredActors.length})
                    </h2>
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Tìm thực thể..."
                            className="w-full h-9 pl-8 pr-3 bg-slate-950/50 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-1 p-1 bg-slate-950/50 rounded-md border border-slate-800/50">
                        {(["all", "alive", "dead"] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 text-[10px] uppercase font-medium rounded transition-all ${filterStatus === status
                                    ? "bg-slate-800 text-slate-200 shadow-sm"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                    }`}
                            >
                                {status === "all" ? "Tất cả" : status === "alive" ? "Sống" : "Mất"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredActors.map(actor => (
                    <div
                        key={actor.id}
                        onClick={() => handleActorClick(actor.id)}
                        className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer border border-slate-800/50 bg-slate-900/20 hover:bg-slate-800/40 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all duration-300"
                    >
                        <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden border-2
                            ${actor.is_alive
                                ? "bg-slate-800 border-slate-700 text-slate-300 group-hover:border-cyan-500/50"
                                : "bg-slate-950 border-slate-900 text-slate-700 grayscale"}
                        `}>
                            <User className="w-6 h-6" />
                            {!actor.is_alive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-grayscale">
                                    <Skull className="w-5 h-5 text-red-900/60" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2">
                                <div className="text-sm font-bold truncate text-slate-200 group-hover:text-cyan-100 transition-colors">
                                    {actor.name}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {actor.supreme_entity && (
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                    )}
                                    {!actor.is_alive && <span className="text-[10px] text-red-500/40 font-mono">†</span>}
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold truncate">
                                    {actor.archetype}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600 background-slate-950/50 px-1.5 py-0.5 rounded">
                                    <Star className="w-2.5 h-2.5 text-cyan-500/50" />
                                    <span>{(actor.metrics?.influence ?? 0).toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredActors.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                        <Search className="w-12 h-12 mb-4" />
                        <p className="text-xs uppercase tracking-widest">Không tìm thấy thực thể</p>
                    </div>
                )}
            </div>

            {/* Samsara Path Modal */}
            {showSamsaraId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] bg-[#0c1425] border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-blue-500/20 bg-blue-500/5">
                            <div className="flex items-center gap-2">
                                <HistoryIcon className="w-4 h-4 text-blue-400" />
                                <h2 className="text-sm font-bold text-blue-100 uppercase tracking-widest">Samsara Trajectory</h2>
                            </div>
                            <button onClick={() => setShowSamsaraId(null)} className="p-1 hover:bg-white/10 rounded-md text-muted-foreground transition-colors">
                                <ChevronRight className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6"><SamsaraPath agentId={showSamsaraId} /></div>
                        <div className="p-4 border-t border-white/5 bg-slate-950/40 text-center">
                            <button onClick={() => setShowSamsaraId(null)} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
