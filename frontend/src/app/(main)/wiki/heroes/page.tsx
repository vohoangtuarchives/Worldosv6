"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo } from "react";
import Link from "next/link";
import { useWorldStore } from "@/store/useWorldStore";
import { useSimulation } from "@/context/SimulationContext";
import { Network, Trophy, Swords, Crown } from "lucide-react";
import { useZenithSync } from "@/hooks/useZenithSync";

export default function LegendsGalleryPage() {
    const { universeId } = useSimulation();
    
    // Ensure we are synced to get actor nodes
    useZenithSync(universeId);

    const actorNodes = useWorldStore(state => state.actorNodes);
    const topActors = useMemo(() => {
        return [...actorNodes].sort((a, b) => b.dominance - a.dominance).slice(0, 50);
    }, [actorNodes]);

    return (
        <div className="py-8 font-serif">
            <header className="mb-12 border-b border-[#2a2824] pb-6">
                <h1 className="text-4xl font-black text-[#d4cbb3] tracking-widest uppercase mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                    Hall of Legends
                </h1>
                <p className="text-[#8a8573] flex items-center gap-2">
                    <Network size={16} />
                    <span>The most influential figures woven into the multiversal fabric.</span>
                </p>
            </header>

            {topActors.length === 0 ? (
                <div className="flex items-center justify-center p-20 text-[#8a8573] italic">
                    The Loom has not yet recorded any significant lives.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topActors.map((actor, idx) => (
                        <Link href={`/wiki/heroes/${actor.id}`} key={actor.id} className="group">
                            <div className="p-6 h-full bg-[#141518]/80 backdrop-blur-sm border border-[#2a2824] rounded-lg shadow-lg hover:border-amber-500/50 hover:bg-[#1a1b1f] transition-all flex flex-col relative overflow-hidden">
                                {/* Rank Ribbon */}
                                {idx < 3 && (
                                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                                        <div className="absolute top-2 -right-6 py-1 px-8 bg-amber-600/80 text-[#141518] text-[10px] font-black uppercase tracking-widest rotate-45 flex items-center gap-1 shadow-md">
                                            <Crown size={10} /> Rank {idx + 1}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-sm bg-[#0a0b0d] border border-[#2a2824] flex items-center justify-center shrink-0">
                                        {/* Placeholder Portrait generator based on ID */}
                                        <div className="text-2xl font-black text-[#8a8573]/50" style={{ fontFamily: 'Cinzel, serif' }}>
                                            {actor.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs uppercase tracking-widest text-amber-500/80 font-bold mb-1">
                                            DOMINANCE 
                                        </div>
                                        <div className="text-xl font-mono text-[#d4cbb3]">
                                            {Math.round(actor.dominance).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-[#d4cbb3] mb-1 group-hover:text-amber-400 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                                        {actor.name}
                                    </h3>
                                    <p className="text-xs uppercase tracking-widest text-[#8a8573] mb-4">
                                        {actor.archetype || 'The Unknown'} | Faction {actor.faction_id || 0}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-auto border-t border-[#2a2824] pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-widest text-[#5a574a]">Base Tech</span>
                                            <span className="text-xs font-mono text-cyan-500/80">{actor.tech_level || 'Primitive'}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] uppercase tracking-widest text-[#5a574a]">Hunger</span>
                                            <span className="text-xs font-mono text-amber-500/80">{((actor.hunger || 0) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
