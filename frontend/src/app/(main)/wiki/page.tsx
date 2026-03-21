"use client";

export const dynamic = 'force-dynamic';

import React from "react";
import { useSimulation } from "@/context/SimulationContext";
import { useZenithSync } from "@/hooks/useZenithSync";
import { useWorldStore } from "@/store/useWorldStore";
import { Skull, Sparkles, BookOpen, Clock, Zap } from "lucide-react";

export default function GrandTimelinePage() {
    const { universeId, universe } = useSimulation();
    
    // Sync WS
    useZenithSync(universeId);
    
    const sagas = useWorldStore(state => state.sagas);
    const activeCalamities = useWorldStore(state => state.activeCalamities);
    const currentTick = useWorldStore(state => state.currentTick);

    if (!universeId) {
        return (
            <div className="flex items-center justify-center p-20 text-[#8a8573] italic">
                Awaiting connection to a Universe...
            </div>
        );
    }

    return (
        <div className="py-8 font-serif">
            <header className="mb-12 border-b border-[#2a2824] pb-6">
                <h1 className="text-4xl font-black text-[#d4cbb3] tracking-widest uppercase mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                    The Grand Timeline
                </h1>
                <p className="text-[#8a8573] flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>Chronicles of {universe?.name || `Universe #${universeId}`} — Tick {currentTick}</span>
                </p>
            </header>

            {/* Active Calamities Section (Great Filter Alerts) */}
            {activeCalamities.length > 0 && (
                <div className="mb-12 space-y-4">
                    <h2 className="text-xl text-rose-500 font-bold uppercase tracking-widest border-b border-rose-900/50 pb-2 flex items-center gap-2">
                        <Skull size={20} className="animate-pulse" />
                        Current Cataclysms
                    </h2>
                    {activeCalamities.map(cal => (
                        <div key={cal.id} className="p-6 bg-rose-950/20 border border-rose-900/50 rounded-lg shadow-inner">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-1 bg-rose-900/50 text-rose-300 text-[10px] font-bold uppercase tracking-widest rounded">
                                    Tick {cal.tick}
                                </span>
                                <h3 className="text-lg text-rose-400 font-black tracking-wide">{cal.type}</h3>
                            </div>
                            <p className="text-[#d4cbb3] leading-relaxed opacity-90">{cal.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Sagas Feed (The Legends) */}
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#2a2824] before:to-transparent">
                {sagas.length === 0 ? (
                    <div className="text-center text-[#8a8573] italic p-10">
                        The Loom is silent. No sagas have been woven yet.
                    </div>
                ) : (
                    sagas.map((saga, index) => (
                        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">
                            {/* Marker */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#d4cbb3]/20 bg-[#141518] text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <Sparkles size={16} />
                            </div>
                            
                            {/* Content Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-lg bg-[#141518]/80 backdrop-blur-sm border border-[#2a2824] shadow-md group-hover:bg-[#1a1b1f] hover:border-[#3a3731] transition-all animate-ink">
                                <div className="flex items-center justify-between mb-3 border-b border-[#2a2824] pb-2">
                                    <span className="text-xs font-sans text-amber-500/80 font-bold tracking-widest uppercase">
                                        Legend Recorded
                                    </span>
                                </div>
                                <p className={`text-[#d4cbb3] leading-loose text-sm italic ${index === 0 ? 'illuminated-drop-cap' : ''}`}>
                                    "{saga}"
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* End of Line */}
            {sagas.length > 0 && (
                <div className="flex justify-center mt-12 opacity-50">
                    <Zap className="text-[#8a8573]" />
                </div>
            )}
        </div>
    );
}
