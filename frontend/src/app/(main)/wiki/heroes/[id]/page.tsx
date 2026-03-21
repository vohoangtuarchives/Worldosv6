"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorldStore } from "@/store/useWorldStore";
import { ArrowLeft, BrainCircuit, Activity, Network, ScrollText, Target, ShieldAlert, BookOpen, Trophy } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { LineageTree } from "@/components/wiki/LineageTree";

// Utility to generate deterministic pseudorandom numbers
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

export default function HeroWikiPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === 'string' ? params.id : '';
    
    const actorNodes = useWorldStore(state => state.actorNodes);
    
    const actor = useMemo(() => {
        return actorNodes.find(n => n.id === id);
    }, [actorNodes, id]);

    const dominantTrait = useMemo(() => {
        const traits = ['Dominance', 'Fear', 'Logic', 'Greed', 'Loyalty'];
        return traits[Math.floor(seededRandom(parseInt(id.replace(/\D/g, '') || '1')) * traits.length)];
    }, [id]);

    const auraColor = useMemo(() => {
        switch(dominantTrait) {
            case 'Dominance': return 'rgba(239, 68, 68, 0.4)'; // Red
            case 'Fear': return 'rgba(245, 158, 11, 0.4)'; // Amber
            case 'Logic': return 'rgba(6, 182, 212, 0.4)'; // Cyan
            case 'Greed': return 'rgba(168, 85, 247, 0.4)'; // Purple
            default: return 'rgba(139, 92, 246, 0.4)'; // Violet
        }
    }, [dominantTrait]);

    // Generate deterministic 17D Trait Matrix if not fully provided by backend
    const soulMatrix = useMemo(() => {
        if (!actor) return [];
        const numId = parseInt(actor.id.replace(/\D/g, '') || '1');
        
        const traits = [
            'Dominance', 'Fear', 'Shame', 'Joy', 'Curiosity', 
            'Greed', 'Empathy', 'Zealotry', 'Logic', 'Intuition',
            'Cruelty', 'Honor', 'Paranoia', 'Apathy', 'Ambition', 'Loyalty', 'Creativity'
        ];
        
        return traits.map((trait, index) => ({
            name: trait,
            value: Math.floor(seededRandom(numId * 100 + index) * 100)
        }));
    }, [actor]);

    if (!actor) {
        return (
            <div className="py-20 text-center font-serif text-[#8a8573]">
                <p>The Loom cannot find the threads of this existence.</p>
                <button 
                    onClick={() => router.push('/wiki/heroes')}
                    className="mt-6 px-4 py-2 border border-[#2a2824] hover:bg-[#1a1b1f] rounded transition-colors"
                >
                    Return to the Archives
                </button>
            </div>
        );
    }

    return (
        <div className="py-8 font-serif">
            {/* Navigation */}
            <button 
                onClick={() => router.push('/wiki/heroes')}
                className="flex items-center gap-2 text-xs font-sans text-zinc-500 hover:text-amber-500 transition-colors mb-8"
            >
                <ArrowLeft size={14} />
                Back to Hall of Legends
            </button>

            {/* Header Profile */}
            <header className="flex flex-col md:flex-row gap-8 mb-12 border-b border-[#2a2824] pb-8">
                <div className="relative group shrink-0">
                    <div className="mind-aura" style={{ boxShadow: `0 0 40px ${auraColor}`, backgroundColor: auraColor }} />
                    <div className="w-40 h-40 bg-[#0a0b0d] border border-[#3a3731] shadow-[0_0_30px_rgba(245,158,11,0.1)] shrink-0 flex items-center justify-center relative overflow-hidden group z-10">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 to-transparent opacity-50"></div>
                        <span className="text-7xl text-[#8a8573]/30 font-black group-hover:scale-110 transition-transform duration-500" style={{ fontFamily: 'Cinzel, serif' }}>
                            {actor.name.charAt(0)}
                        </span>
                        <div className="absolute bottom-0 left-0 right-0 bg-[#141518]/90 text-center py-1 text-[9px] uppercase tracking-widest text-[#5a574a]">
                            ID: {actor.id}
                        </div>
                    </div>
                    {/* Trait Aura Label */}
                    <div className="absolute -bottom-2 left-1/2 -track-x-1/2 bg-[#141518] px-3 py-1 rounded-full border border-[#2a2824] text-[10px] uppercase tracking-[.2em] text-[#8a8573] z-20 whitespace-nowrap shadow-lg translate-x-[-50%]">
                        {dominantTrait} Essence
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <h1 className="text-4xl font-black text-[#d4cbb3] tracking-widest uppercase mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                        {actor.name}
                    </h1>
                    <p className="text-[#8a8573] text-sm uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2">
                        {actor.archetype || 'The Unknown'} <span className="opacity-30">•</span> Faction {actor.faction_id || 0}
                    </p>
                    
                    <div className="flex gap-6 mt-auto">
                        <div className="flex items-center gap-2 text-amber-500/80">
                            <Trophy size={16} />
                            <div>
                                <div className="text-[10px] uppercase font-sans tracking-widest text-[#5a574a]">Dominance</div>
                                <div className="font-mono text-lg font-bold">{Math.round(actor.dominance).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-500/80">
                            <Activity size={16} />
                            <div>
                                <div className="text-[10px] uppercase font-sans tracking-widest text-[#5a574a]">Base Energy</div>
                                <div className="font-mono text-lg font-bold">{((actor.hunger || 0) * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-rose-500/80">
                            <ShieldAlert size={16} />
                            <div>
                                <div className="text-[10px] uppercase font-sans tracking-widest text-[#5a574a]">Stress Level</div>
                                <div className="font-mono text-lg font-bold">Critical</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Radar - The Soul Matrix */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 p-6 bg-[#141518]/80 backdrop-blur-sm border border-[#2a2824] rounded-lg shadow-lg">
                        <h2 className="text-xl font-black text-[#d4cbb3] tracking-widest uppercase border-b border-[#2a2824] pb-2 mb-4 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            <BrainCircuit size={18} className="text-violet-400" />
                            Soul Matrix 17D
                        </h2>
                        
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={soulMatrix}>
                                    <PolarGrid stroke="#2a2824" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#8a8573', fontSize: 9 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#141518', borderColor: '#3a3731', color: '#d4cbb3', fontSize: '12px' }}
                                        itemStyle={{ color: '#8b5cf6' }}
                                    />
                                    <Radar
                                        name="Core Trait"
                                        dataKey="value"
                                        stroke="#8b5cf6"
                                        fill="#8b5cf6"
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-2 text-[10px] text-[#5a574a] uppercase tracking-widest">
                            Psychological Blueprint Analysis
                        </div>
                    </div>
                </div>

                {/* Right Column - Deep Lore */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* The Scars & Memories */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-[#d4cbb3] tracking-widest uppercase border-b border-[#2a2824] pb-2 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            <ScrollText size={18} className="text-amber-500" />
                            Scars & Heritage
                        </h2>
                        <div className="p-4 bg-rose-950/10 border-l-2 border-rose-900/50">
                            <p className="text-[#8a8573] italic leading-relaxed text-sm">
                                "This actor bears the deep psychological scars of past calamities. The simulation marks an inherited trauma passed down from their lineage, heavily skewing their Paranoia and Fear vectors. Such ancestral memories dictate their survivalist approach."
                            </p>
                        </div>
                    </div>

                    {/* Deeds & Legends */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-[#d4cbb3] tracking-widest uppercase border-b border-[#2a2824] pb-2 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            <BookOpen size={18} className="text-cyan-500" />
                            Recorded Deeds
                        </h2>
                        <ul className="space-y-3">
                            <li className="flex gap-3 items-start">
                                <Target size={14} className="text-[#5a574a] mt-1 shrink-0" />
                                <span className="text-sm text-[#d4cbb3] leading-relaxed">
                                    Decreed the first law of <strong className="text-amber-500/80 font-normal">Urban Expansion</strong>, leading to a massive spike in material stress across the region.
                                </span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <Target size={14} className="text-[#5a574a] mt-1 shrink-0" />
                                <span className="text-sm text-[#d4cbb3] leading-relaxed">
                                    Survived the <strong className="text-rose-500/80 font-normal">Tick 450 Collapse</strong>, escaping with severe psychological mutation.
                                </span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <Target size={14} className="text-[#5a574a] mt-1 shrink-0" />
                                <span className="text-sm text-[#d4cbb3] leading-relaxed">
                                    Founded the ideological sect <em className="text-violet-400">Order of {actor.name}</em>, gathering hundreds of followers through dominant force.
                                </span>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Lineage Tree Hook */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-[#d4cbb3] tracking-widest uppercase border-b border-[#2a2824] pb-2 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            <Network size={18} className="text-violet-400" />
                            Ancestral Lineage
                        </h2>
                        <LineageTree rootActorId={actor.id} />
                    </div>

                </div>
            </div>
        </div>
    );
}
