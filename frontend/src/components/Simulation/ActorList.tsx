"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
    Users, Shield, Zap, Star, Eye, ChevronRight, User, 
    Search, Filter, Skull, HeartPulse, BrainCircuit, Sparkles 
} from "lucide-react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    ResponsiveContainer
} from 'recharts';
import { useSimulation } from "@/context/SimulationContext";

interface Actor {
    id: number;
    name: string;
    archetype: string;
    traits: number[];
    biography: string;
    is_alive: boolean;
    metrics: { influence?: number };
}

const TRAIT_DIMENSIONS = [
    "Dom", "Amb", "Coe", // Power
    "Loy", "Emp", "Sol", "Con", // Social
    "Pra", "Cur", "Dog", "Rsk", // Cognitive
    "Fer", "Ven", "Hop", "Grf", "Pri", "Shm" // Emotional
];

function ActorRadarChart({ traits }: { traits: number[] }) {
    const data = useMemo(() => {
        return TRAIT_DIMENSIONS.map((label, i) => ({
            subject: label,
            A: traits[i] ?? 0,
            fullMark: 1.0,
        }));
    }, [traits]);

    return (
        <div className="h-[220px] w-full mt-4 bg-slate-950/50 rounded-xl p-2 border border-slate-800/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent pointer-events-none" />
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" strokeOpacity={0.4} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                    />
                    <Radar
                        name="Traits"
                        dataKey="A"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="#f59e0b"
                        fillOpacity={0.2}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

function ActorBiography({ text }: { text: string }) {
    if (!text) return (
        <div className="text-slate-500 italic">No records found in the archives...</div>
    );

    // Regex to capture pattern: " - T<digits>: " or "- T<digits>: "
    // This splits the string but keeps the delimiter parts (T<digits>) in the array
    const parts = text.split(/[-–]\s*T(\d+):/g);
    
    // If no match found (length 1), it's just a normal paragraph
    if (parts.length === 1) {
        return (
            <div className="text-base text-slate-300 leading-relaxed font-serif whitespace-pre-line">
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
        const contentVal = parts[i+1];  // e.g. "Rời bỏ chốn cũ..."
        
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
                <div key={idx} className="relative pl-6 border-l-2 border-slate-700/50 hover:border-amber-500 transition-colors group">
                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-slate-600 group-hover:border-amber-500 group-hover:bg-amber-500/20 transition-all shadow-sm" />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-mono font-bold text-amber-500/90 uppercase tracking-wider bg-amber-500/5 px-2 py-0.5 rounded w-fit border border-amber-500/10">
                            {entry.tick}
                        </span>
                        <p className="text-lg text-slate-200 leading-relaxed font-serif">
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
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "alive" | "dead">("all");

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

    const selectedActor = actors.find(a => a.id === selectedActorId) || filteredActors[0];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 animate-pulse">
                <Users className="w-12 h-12 opacity-50" />
                <span className="text-sm font-mono tracking-widest uppercase">Scanning Heroic Signatures...</span>
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
                    <p className="text-lg font-medium text-slate-400">No Actors Manifested</p>
                    <p className="text-sm opacity-60 max-w-xs mx-auto">The stage is empty. Pulse the world to ignite causality and birth new souls.</p>
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
                        <Users className="w-4 h-4 text-amber-400" />
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
                            placeholder="Search entities..." 
                            className="w-full h-9 pl-8 pr-3 bg-slate-950/50 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-1 p-1 bg-slate-950/50 rounded-md border border-slate-800/50">
                        {(["all", "alive", "dead"] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`flex-1 py-1 text-[10px] uppercase font-medium rounded transition-all ${
                                    filterStatus === status 
                                    ? "bg-slate-800 text-slate-200 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                }`}
                            >
                                {status}
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
                                    ? "bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]" 
                                    : "bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-800"
                                }
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden border
                                ${actor.is_alive 
                                    ? "bg-slate-800 border-slate-700 text-slate-300 group-hover:border-slate-500" 
                                    : "bg-slate-900 border-slate-800 text-slate-600 grayscale"}
                                ${selectedActorId === actor.id && actor.is_alive ? "border-amber-500/50 text-amber-400" : ""}
                            `}>
                                <User className="w-5 h-5" />
                                {!actor.is_alive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-grayscale">
                                        <Skull className="w-4 h-4 text-red-900/80" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <div className={`text-sm font-medium truncate ${selectedActorId === actor.id ? "text-amber-100" : "text-slate-300 group-hover:text-slate-200"}`}>
                                        {actor.name}
                                    </div>
                                    {!actor.is_alive && <span className="text-[9px] text-red-500/60 font-mono ml-2">†</span>}
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate max-w-[100px]">
                                        {actor.archetype}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
                                        <Star className="w-2.5 h-2.5 text-amber-500/40" />
                                        <span>{(actor.metrics?.influence ?? 0).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedActorId === actor.id && (
                                <ChevronRight className="w-4 h-4 text-amber-500/50 animate-pulse" />
                            )}
                        </div>
                    ))}
                    
                    {filteredActors.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-600 italic">
                            No entities found matching criteria.
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
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900 to-slate-950" />
                            <div className="absolute inset-0 opacity-30" 
                                 style={{ backgroundImage: 'url("/patterns/grid.svg")', backgroundSize: '30px 30px' }} 
                            />
                            
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-end gap-6">
                                <div className={`
                                    w-24 h-24 rounded-2xl border-2 shadow-2xl flex items-center justify-center relative bg-slate-900
                                    ${selectedActor.is_alive ? "border-amber-500/30 shadow-amber-900/20" : "border-slate-800 grayscale opacity-80"}
                                `}>
                                    <User className={`w-12 h-12 ${selectedActor.is_alive ? "text-amber-400" : "text-slate-600"}`} />
                                    <div className={`absolute -bottom-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border shadow-lg ${
                                        selectedActor.is_alive 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                    }`}>
                                        {selectedActor.is_alive ? "Alive" : "Deceased"}
                                    </div>
                                </div>
                                
                                <div className="mb-1 flex-1">
                                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                                        {selectedActor.name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs font-medium uppercase tracking-wider rounded border border-amber-500/20">
                                            {selectedActor.archetype}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                                            <span className="text-yellow-100">{(selectedActor.metrics?.influence ?? 0).toFixed(1)}</span>
                                            <span className="opacity-50">Influence</span>
                                        </div>
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
                                            <Sparkles className="w-4 h-4 text-purple-400" /> 
                                            Biography
                                        </h3>
                                        <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/50 shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500/50 to-transparent" />
                                            <ActorBiography text={selectedActor.biography} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <HeartPulse className="w-3 h-3" /> Vitality
                                            </div>
                                            <div className="text-2xl font-mono text-slate-200">100%</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <BrainCircuit className="w-3 h-3" /> Cognition
                                            </div>
                                            <div className="text-2xl font-mono text-slate-200">High</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Psychometrics */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-widest">
                                            <Zap className="w-4 h-4 text-amber-400" /> 
                                            Psychometric Profile
                                        </h3>
                                        <span className="text-[10px] text-slate-500 font-mono border border-slate-800 rounded px-1.5">17-DIMENSION SCAN</span>
                                    </div>
                                    <ActorRadarChart traits={selectedActor.traits} />
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {TRAIT_DIMENSIONS.slice(0, 6).map((trait, i) => (
                                            <div key={trait} className="flex justify-between items-center px-3 py-1.5 rounded bg-slate-900/30 border border-slate-800/30">
                                                <span className="text-[10px] text-slate-500 uppercase font-mono">{trait}</span>
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-amber-500/50" 
                                                        style={{ width: `${(selectedActor.traits[i] ?? 0) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 bg-slate-950/50">
                        <div className="text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium text-slate-500">Select an entity to view dossier</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
