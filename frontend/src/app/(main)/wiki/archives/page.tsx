"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { useSimulation } from "@/context/SimulationContext";
import { Scroll, Sparkles, BookOpen, Quote } from "lucide-react";

export default function ArchivesPage() {
    const { universeId } = useSimulation();
    const sagas = useWorldStore(state => state.sagas);
    
    const [selectedSaga, setSelectedSaga] = useState<string | null>(null);
    const [translation, setTranslation] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [decipheringChars, setDecipheringChars] = useState<string>('');

    const ancientSymbols = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚻᚼᛁᛄᛈᛇᛉᛊᛋᛏᛒᛖᛗᛚᛜᛟᛞ";

    // Mock LLM streaming simulation
    useEffect(() => {
        if (!isTranslating || !selectedSaga) return;

        setTranslation('');
        const proseText = `[LLM Translation Initiated...]\n\n"The annals of Tick ${Math.floor(Math.random() * 1000)} speak of a profound shift: \n\n${selectedSaga}\n\nScholars believe this event fundamentally altered the neural architecture of the survivors, branding their lineage with an indelible scar of paranoia and ambition."`;
        
        let index = 0;
        const interval = setInterval(() => {
            // Decipher effect: show random ancient symbol before real char
            const symbol = ancientSymbols[Math.floor(Math.random() * ancientSymbols.length)];
            setDecipheringChars(symbol);
            
            setTranslation((prev) => prev + proseText.charAt(index));
            index++;
            if (index >= proseText.length) {
                clearInterval(interval);
                setIsTranslating(false);
                setDecipheringChars('');
            }
        }, 20); // Faster for energy

        return () => clearInterval(interval);
    }, [isTranslating, selectedSaga]);

    const handleTranslate = (saga: string) => {
        if (isTranslating) return;
        setSelectedSaga(saga);
        setIsTranslating(true);
    };

    return (
        <div className="py-8 font-serif">
            <header className="mb-12 border-b border-[#2a2824] pb-6">
                <h1 className="text-4xl font-black text-[#d4cbb3] tracking-widest uppercase mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                    The Grand Archive
                </h1>
                <p className="text-[#8a8573] flex items-center gap-2">
                    <Scroll size={16} />
                    <span>The Repository of Myths, Ideologies, and Translated Prophecies.</span>
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)]">
                {/* Left: Raw Sagas */}
                <div className="bg-[#141518]/80 backdrop-blur-sm border border-[#2a2824] rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-[#2a2824] bg-[#0a0b0d]">
                        <h2 className="text-sm font-black text-[#d4cbb3] tracking-widest uppercase flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            <BookOpen size={16} className="text-amber-500" />
                            Chronicles (Raw Feed)
                        </h2>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {sagas.length === 0 ? (
                            <div className="text-center text-[#8a8573] italic pt-10">
                                The Archive is empty. Wait for history to unfold.
                            </div>
                        ) : (
                            sagas.map((saga, idx) => (
                                <div key={idx} className={`p-4 rounded border transition-colors cursor-pointer ${
                                    selectedSaga === saga 
                                        ? 'bg-[#1a1b1f] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                        : 'bg-[#0a0b0d] border-[#2a2824] hover:border-[#3a3731]'
                                }`} onClick={() => handleTranslate(saga)}>
                                    <div className="flex items-start gap-3">
                                        <Quote size={14} className="text-[#5a574a] mt-1 shrink-0 rotate-180" />
                                        <p className="text-sm text-[#d4cbb3] italic leading-relaxed">{saga}</p>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleTranslate(saga); }}
                                            disabled={isTranslating}
                                            className="text-[10px] uppercase font-sans tracking-widest text-amber-500 hover:text-amber-400 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <Sparkles size={10} />
                                            Translate to Prose
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Rosetta Stone / Prose Translation */}
                <div className="bg-[#0a0b0d] relative rounded-lg border border-[#2a2824] shadow-inner flex flex-col overflow-hidden before:absolute before:inset-0 before:bg-[url('/textures/parchment.png')] before:opacity-[0.03] before:pointer-events-none">
                    <div className="p-4 border-b border-[#2a2824] bg-[#141518]/90 z-10 relative">
                        <h2 className="text-sm font-black text-[#d4cbb3] tracking-widest uppercase flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                            <Sparkles size={16} className="text-violet-400" />
                            Deep Lore Decoder (LLM Synthesis)
                        </h2>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                        {!selectedSaga ? (
                            <div className="h-full flex flex-col items-center justify-center text-[#5a574a] opacity-50">
                                <Sparkles size={32} className="mb-4" />
                                <p className="text-sm tracking-widest uppercase">Select a chronicle to translate</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-amber max-w-none">
                                <pre className="whitespace-pre-wrap font-serif text-[#d4cbb3] leading-loose text-lg bg-transparent border-none p-0 !my-0 relative animate-ink">
                                    {translation}
                                    {isTranslating && (
                                        <span className="text-amber-500 font-mono text-xl animate-pulse ml-1">{decipheringChars}</span>
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
