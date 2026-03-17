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
    const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
    const [actorEvents, setActorEvents] = useState<ActorEvent[]>([]);
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

    // Select first actor automatically if none selected
    useEffect(() => {
        if (!selectedActorId && filteredActors.length > 0) {
            setSelectedActorId(filteredActors[0].id);
        }
    }, [filteredActors, selectedActorId]);

    // Fetch life timeline (actor_events) when actor selected
    useEffect(() => {
        if (!selectedActorId) {
            setActorEvents([]);
            return;
        }
        api.actorEvents(selectedActorId)
            .then((res: unknown) => {
                const list = Array.isArray(res) ? res : (res as { data?: ActorEvent[] })?.data ?? [];
                setActorEvents(list);
            })
            .catch(() => setActorEvents([]));
    }, [selectedActorId]);

    const selectedActor = actors.find(a => a.id === selectedActorId) || filteredActors[0];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 animate-pulse">
                <Users className="w-12 h-12 opacity-50" />
                <span className="text-sm font-mono tracking-widest uppercase">Đang quét chữ ký anh hùng...</span>
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
        <div className="h-full flex bg-slate-950/30 backdrop-blur-md rounded-xl border border-slate-800/50 overflow-hidden shadow-2xl">
            {/* Left Sidebar: List */}
            <div className="w-1/3 min-w-[300px] border-r border-slate-800/50 flex flex-col bg-slate-900/40">
                {/* Search & Filter Header */}
                <div className="p-4 border-b border-slate-800/50 space-y-3 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                            Dramatis Personae
                        </h3>
                        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {filteredActors.length} / {actors.length}
                        </span>
                    </div>

                    <div className="relative">
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
                                className={`flex-1 py-1 text-[10px] uppercase font-medium rounded transition-all ${filterStatus === status
                                    ? "bg-slate-800 text-slate-200 shadow-sm"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                    }`}
                            >
                                {status === "all" ? "Tất cả" : status === "alive" ? "Sống" : "Đã mất"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredActors.map(actor => (
                        <div
                            key={actor.id}
                            onClick={() => setSelectedActorId(actor.id)}
                            className={`
                                group flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200
                                ${selectedActorId === actor.id
                                    ? "bg-cyan-500/10 border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]"
                                    : "bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-800"
                                }
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden border
                                ${actor.is_alive
                                    ? "bg-slate-800 border-slate-700 text-slate-300 group-hover:border-slate-500"
                                    : "bg-slate-900 border-slate-800 text-slate-600 grayscale"}
                                ${selectedActorId === actor.id && actor.is_alive ? "border-cyan-500/50 text-cyan-400" : ""}
                            `}>
                                <User className="w-5 h-5" />
                                {!actor.is_alive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-grayscale">
                                        <Skull className="w-4 h-4 text-red-900/80" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline gap-1">
                                        <div className={`text-sm font-medium truncate ${selectedActorId === actor.id ? "text-cyan-100" : "text-slate-300 group-hover:text-slate-200"}`}>
                                            {actor.name}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {(actor.is_transmigrated || actor.is_isekai) && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowSamsaraId(actor.id);
                                                    }}
                                                    className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 font-medium uppercase tracking-wider hover:bg-fuchsia-500/30 transition-all shadow-[0_0_5px_rgba(217,70,239,0.2)]" title="Xem luân hồi (Samsara Path)"
                                                >
                                                    <Repeat className="w-2.5 h-2.5" />
                                                    Xuyên Không
                                                </button>
                                            )}
                                            {actor.supreme_entity && (
                                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium uppercase tracking-wider" title="Vĩ nhân">
                                                    <Sparkles className="w-2.5 h-2.5" />
                                                    Vĩ nhân
                                                </span>
                                            )}
                                            {!actor.is_alive && <span className="text-[9px] text-red-500/60 font-mono">†</span>}
                                        </div>
                                    </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate max-w-[100px]">
                                        {actor.archetype}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
                                        <Star className="w-2.5 h-2.5 text-cyan-500/40" />
                                        <span>{(actor.metrics?.influence ?? 0).toFixed(1)}</span>
                                    </div>
                                </div>
                                {actor.dynasty && (
                                    <div className="text-[9px] text-amber-500/80 font-medium uppercase mt-0.5 tracking-tighter">
                                        Dynasty: {actor.dynasty}
                                    </div>
                                )}
                            </div>

                            {selectedActorId === actor.id && (
                                <ChevronRight className="w-4 h-4 text-cyan-500/50 animate-pulse" />
                            )}
                        </div>
                    ))}

                    {filteredActors.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-600 italic">
                            Không tìm thấy thực thể phù hợp.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className="flex-1 flex flex-col bg-slate-950/20 relative overflow-hidden">
                {selectedActor ? (
                    <>
                        {/* Profile Header */}
                        <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950" />
                            <div className="absolute inset-0 opacity-30"
                                style={{ backgroundImage: 'url("/patterns/grid.svg")', backgroundSize: '30px 30px' }}
                            />

                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end gap-6">
                                <div className={`
                                    w-24 h-24 rounded-2xl border-2 shadow-2xl flex items-center justify-center relative bg-slate-900
                                    ${selectedActor.is_alive ? "border-cyan-500/30 shadow-cyan-900/20" : "border-slate-800 grayscale opacity-80"}
                                `}>
                                    <User className={`w-12 h-12 ${selectedActor.is_alive ? "text-cyan-400" : "text-slate-600"}`} />
                                    <div className={`absolute -bottom-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border shadow-lg ${selectedActor.is_alive
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                        }`}>
                                        {selectedActor.is_alive ? "Sống" : "Đã mất"}
                                    </div>
                                </div>

                                <div className="mb-1 flex-1">
                                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                                        {selectedActor.name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 text-xs font-medium uppercase tracking-wider rounded border border-cyan-500/20">
                                            {selectedActor.archetype}
                                        </span>
                                        {(selectedActor.is_transmigrated || selectedActor.is_isekai) && (
                                            <button 
                                                onClick={() => setShowSamsaraId(selectedActor.id)}
                                                className="px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-medium uppercase tracking-wider rounded border border-fuchsia-500/20 shadow-[0_0_8px_rgba(217,70,239,0.3)] hover:bg-fuchsia-500/20 transition-all flex items-center gap-1"
                                            >
                                                <Repeat className="w-3 h-3" />
                                                Quỹ đạo Luân hồi
                                            </button>
                                        )}
                                        {selectedActor.supreme_entity && (
                                            <Link
                                                href="/dashboard/heroes"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium uppercase tracking-wider rounded border border-amber-500/30 hover:bg-amber-500/30 hover:border-amber-500/50 transition-colors"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                Vĩ nhân
                                            </Link>
                                        )}
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                                            <span className="text-yellow-100">{(selectedActor.metrics?.influence ?? 0).toFixed(1)}</span>
                                            <span className="opacity-50">Influence</span>
                                        </div>
                                        {selectedActor.heroic_type && (
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 text-[10px] font-bold uppercase tracking-widest rounded border border-purple-500/20">
                                                {getTypeLabel(selectedActor.heroic_type)}
                                            </span>
                                        )}
                                        {selectedActor.dynasty && (
                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-widest rounded border border-amber-500/20">
                                                House {selectedActor.dynasty}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Bio & Stats */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4 text-cyan-400" />
                                            Biên Niên Sử (Chronicle)
                                        </h3>
                                        <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/50 shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500/50 to-transparent" />
                                            <ActorBiography text={selectedActor.biography} />
                                        </div>
                                    </div>

                                    {selectedActor.metrics?.reasoning && (
                                        <div className="space-y-3">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                                <MessageSquare className="w-4 h-4 text-emerald-400" />
                                                Độc thoại nội tâm (Reasoning)
                                            </h3>
                                            <div className="p-5 rounded-xl bg-emerald-950/10 border border-emerald-500/20 shadow-inner relative overflow-hidden italic text-emerald-100/90 leading-relaxed">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                                                "{selectedActor.metrics.reasoning}"
                                            </div>
                                        </div>
                                    )}

                                    {actorEvents.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                                <Clock className="w-4 h-4 text-cyan-400" />
                                                Life timeline (events)
                                            </h3>
                                            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                                {actorEvents.map((ev) => (
                                                    <div key={ev.id} className="flex gap-2 text-sm">
                                                        <span className="font-mono text-cyan-400 text-xs shrink-0">T{ev.tick}</span>
                                                        <div>
                                                            <span className="text-slate-400 capitalize">{ev.event_type}</span>
                                                            {ev.context && typeof ev.context === "object" && Object.keys(ev.context).length > 0 && (
                                                                <span className="text-slate-500 text-xs ml-1">— {JSON.stringify(ev.context)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                            <User className="w-4 h-4 text-cyan-400" />
                                            Thông tin cơ bản
                                        </h3>
                                        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-slate-500 text-xs uppercase">ID</span>
                                                <div className="font-mono text-slate-200">{selectedActor.id}</div>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-xs uppercase">Thế hệ</span>
                                                <div className="font-mono text-slate-200">{selectedActor.generation ?? "—"}</div>
                                            </div>
                                            {selectedActor.universe_id != null && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Vũ trụ</span>
                                                    <div className="font-mono text-slate-200">#{selectedActor.universe_id}</div>
                                                </div>
                                            )}
                                            {selectedActor.lineage_id != null && selectedActor.lineage_id !== "" && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Lineage</span>
                                                    <div className="font-mono text-slate-200 truncate" title={selectedActor.lineage_id}>{selectedActor.lineage_id}</div>
                                                </div>
                                            )}
                                            {selectedActor.parent_actor_id != null && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Parent</span>
                                                    <div className="font-mono text-slate-200">#{selectedActor.parent_actor_id}</div>
                                                </div>
                                            )}
                                            {selectedActor.birth_tick != null && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Birth tick</span>
                                                    <div className="font-mono text-slate-200">T{selectedActor.birth_tick}</div>
                                                </div>
                                            )}
                                            {selectedActor.death_tick != null && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Death tick</span>
                                                    <div className="font-mono text-slate-200">T{selectedActor.death_tick}</div>
                                                </div>
                                            )}
                                            {selectedActor.life_stage != null && selectedActor.life_stage !== "" && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Life stage</span>
                                                    <div className="font-mono text-slate-200 capitalize">{selectedActor.life_stage}</div>
                                                </div>
                                            )}
                                            {selectedActor.trait_scan_status != null && selectedActor.trait_scan_status !== "unknown" && (
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase">Scan</span>
                                                    <div className="font-mono text-slate-200 capitalize">{selectedActor.trait_scan_status}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <HeartPulse className="w-3 h-3" /> Vitality
                                            </div>
                                            <div className="text-2xl font-mono text-slate-200">
                                                {selectedActor.vitality?.health != null
                                                    ? `${Math.round((selectedActor.vitality.health ?? 0) * 100)}%`
                                                    : selectedActor.is_alive ? "100%" : "0%"}
                                            </div>
                                            {selectedActor.vitality && (selectedActor.vitality.age != null || selectedActor.vitality.morale != null) && (
                                                <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                                                    {selectedActor.vitality.age != null && <div>Age: {selectedActor.vitality.age}</div>}
                                                    {selectedActor.vitality.morale != null && <div>Morale: {(selectedActor.vitality.morale * 100).toFixed(0)}%</div>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <BrainCircuit className="w-3 h-3" /> Cognition
                                            </div>
                                            <div className="text-2xl font-mono text-slate-200">
                                                {cognitionLabel(selectedActor.traits ?? [])}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Psychometrics */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                            <Zap className="w-4 h-4 text-cyan-400" />
                                            Hồ sơ tâm lý
                                        </h3>
                                        <span className="text-[10px] text-slate-500 font-mono border border-slate-800 rounded px-1.5">
                                            17-DIMENSION SCAN {selectedActor.trait_scan_status && selectedActor.trait_scan_status !== "unknown" ? ` · ${selectedActor.trait_scan_status}` : ""}
                                        </span>
                                    </div>
                                    <ActorRadarChart traits={selectedActor.traits ?? []} />

                                    <div className="text-xs text-slate-500 mt-2 mb-1 uppercase tracking-wider">17 chiều trait</div>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        {TRAIT_DIMENSIONS.map((trait, i) => (
                                            <div key={`${trait}-${i}`} className="flex justify-between items-center px-3 py-1.5 rounded bg-slate-900/30 border border-slate-800/30">
                                                <span className="text-[10px] text-slate-500 uppercase font-mono">{trait}</span>
                                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden min-w-0">
                                                    <div
                                                        className="h-full bg-cyan-500/60 transition-all"
                                                        style={{ width: `${Math.min(100, ((selectedActor.traits?.[i] ?? 0) * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedActor.metrics && (selectedActor.metrics.energy != null || selectedActor.metrics.contribution != null) && (
                                        <div className="mt-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 text-xs text-slate-400 space-y-1">
                                            {selectedActor.metrics.energy != null && <div>Năng lượng: {Number(selectedActor.metrics.energy).toFixed(1)}</div>}
                                            {selectedActor.metrics.contribution != null && <div>Đóng góp: {Number(selectedActor.metrics.contribution).toFixed(1)}</div>}
                                        </div>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-slate-800/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                                <Orbit className="w-4 h-4 text-blue-400" />
                                                Động lực 8 Trụ cột
                                            </h3>
                                        </div>
                                        <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 flex justify-center scale-90 -mt-2">
                                            <AttractorMandala 
                                                fields={deriveMotivations(selectedActor.traits ?? [])} 
                                                size={300} 
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-4 italic text-center leading-relaxed">
                                            Phản ánh sự cộng hưởng giữa Bản thể (Traits), Văn hóa (Memes) và Môi trường (Fields).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 bg-slate-950/50">
                        <div className="text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            Psychometric Profile
                        </div>
                    </div>
                )}
            </div>

            {/* Samsara Path Modal */}
            {showSamsaraId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] bg-[#0c1425] border border-blue-500/30 rounded-2xl shadow-[0_0_50px_rgba(30,58,138,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-blue-500/20 bg-blue-500/5">
                            <div className="flex items-center gap-2">
                                <HistoryIcon className="w-4 h-4 text-blue-400" />
                                <h2 className="text-sm font-bold text-blue-100 uppercase tracking-widest">Samsara Trajectory (Quỹ đạo Luân hồi)</h2>
                            </div>
                            <button 
                                onClick={() => setShowSamsaraId(null)}
                                className="p-1 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <SamsaraPath agentId={showSamsaraId} />
                        </div>
                        <div className="p-4 border-t border-white/5 bg-slate-950/40 text-center">
                            <button 
                                onClick={() => setShowSamsaraId(null)}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Đóng (Close)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
