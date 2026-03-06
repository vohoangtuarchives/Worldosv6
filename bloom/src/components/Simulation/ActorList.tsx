"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Shield, Zap, Star, Eye, ChevronDown, ChevronUp } from "lucide-react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import type { Actor } from "@/types/simulation";

const TRAIT_DIMENSIONS = [
    "Dom", "Amb", "Coe", // Quyền lực
    "Loy", "Emp", "Sol", "Con", // Xã hội
    "Pra", "Cur", "Dog", "Rsk", // Nhận thức
    "Fer", "Ven", "Hop", "Grf", "Pri", "Shm" // Cảm xúc
];

const TRAIT_FULL_NAMES = [
    "Dominance", "Ambition", "Coercion",
    "Loyalty", "Empathy", "Solidarity", "Conformity",
    "Pragmatism", "Curiosity", "Dogmatism", "RiskTolerance",
    "Fear", "Vengeance", "Hope", "Grief", "Pride", "Shame"
];

function ActorRadar({ traits }: { traits: number[] }) {
    const data = useMemo(() => {
        return TRAIT_DIMENSIONS.map((label, i) => ({
            subject: label,
            value: traits[i] ?? 0,
            full: TRAIT_FULL_NAMES[i]
        }));
    }, [traits]);

    return (
        <div className="h-[200px] w-full mt-2 bg-slate-950/40 rounded-lg p-1 border border-slate-800/50">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                    />
                    <Radar
                        name="Traits"
                        dataKey="value"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.5}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

function ActorCard({ actor }: { actor: Actor }) {
    const [expanded, setExpanded] = useState(false);
    const influence = actor.metrics?.influence?.toFixed(1) ?? "0";

    return (
        <div className={`relative border rounded-lg p-3 transition-all cursor-pointer ${actor.is_alive
            ? "bg-slate-900/60 border-slate-700/50 hover:border-amber-900/40"
            : "bg-slate-950/40 border-slate-800/30 opacity-50"}`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-950/60 border border-amber-900/40 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-100 leading-tight">{actor.name}</div>
                        <div className="text-[10px] text-amber-500/80 font-mono uppercase tracking-wider">{actor.archetype}</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono">
                        <Star className="w-3 h-3" />
                        <span>{influence}</span>
                    </div>
                    <div className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${actor.is_alive ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-500"}`}>
                        {actor.is_alive ? "ALIVE" : "DEAD"}
                    </div>
                </div>
            </div>

            <div className="mt-2 flex justify-center">
                {expanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
            </div>

            {/* Expanded view */}
            {expanded && (
                <div className="mt-1 space-y-3 pt-2 border-t border-slate-800/50">
                    <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-tighter">Trait Signature (17D)</div>
                    <ActorRadar traits={Array.isArray(actor.traits) ? actor.traits : Object.values(actor.traits ?? {})} />

                    {actor.biography && (
                        <div className="mt-3 pt-2 border-t border-slate-800/50">
                            <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line italic">
                                "{actor.biography}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import { useSimulation } from "@/context/SimulationContext";

export function ActorList({ universeId }: { universeId: number | null }) {
    const { actors, loading: contextLoading } = useSimulation();
    const loading = contextLoading && actors.length === 0;

    return (
        <div className="rounded-xl border border-amber-900/20 bg-slate-900/50 overflow-hidden shadow-2xl shadow-black">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-900/20 bg-gradient-to-r from-slate-900 to-amber-950/20">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-mono text-amber-400 uppercase tracking-wider">Anh Hùng Ký</span>
                <span className="ml-auto text-[10px] text-slate-500 font-mono">{actors.length} actors</span>
            </div>
            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {loading && (
                    <div className="text-center py-12 text-slate-500 text-sm font-mono animate-pulse">
                        SCANNING HEROIC SIGNATURES...
                    </div>
                )}
                {!loading && actors.length === 0 && (
                    <div className="text-center py-12 text-slate-600 text-xs font-mono">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>NO ACTORS MANIFESTED</p>
                        <p className="mt-1 opacity-60 text-[10px]">Pulse World để khởi phát nhân quả</p>
                    </div>
                )}
                {actors.map(actor => (
                    <ActorCard key={actor.id} actor={actor} />
                ))}
            </div>
        </div>
    );
}
