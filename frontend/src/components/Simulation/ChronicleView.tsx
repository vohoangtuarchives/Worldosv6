import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Loader2, Scroll, Search, History } from 'lucide-react';

interface Chronicle {
    id: number;
    content: string;
    from_tick: number;
    to_tick: number;
    type: string;
    created_at: string;
    perceived_archive_snapshot?: {
        noise_level: number;
        clarity: string;
        perceived_state: any;
    };
}

import { useSimulation } from '@/context/SimulationContext';

export const ChronicleView: React.FC<{ universeId: number }> = ({ universeId }) => {
    const { chronicles } = useSimulation();
    const [searchTerm, setSearchTerm] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const loading = chronicles.length === 0;

    const filteredChronicles = chronicles.filter(c =>
        (c.content || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col h-full backdrop-blur-md">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-slate-100 uppercase tracking-wider">Biên Niên Sử</h2>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm lịch sử..."
                        className="bg-slate-900 border border-slate-700 rounded-full py-1 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 w-48 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
            >
                {loading && chronicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <p className="text-sm italic">Đang giải mã ký ức vũ trụ...</p>
                    </div>
                ) : filteredChronicles.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic">
                        Không tìm thấy ghi chép nào.
                    </div>
                ) : (
                    filteredChronicles.map((c) => (
                        <div key={c.id} className="relative pl-6 border-l border-amber-500/30 group">
                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-amber-500 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <div className="text-[10px] text-amber-500/70 mb-1 font-mono flex items-center justify-between group-hover:text-amber-400 transition-colors">
                                <div className="flex items-center gap-2">
                                    <History className="w-3 h-3" />
                                    <span>KỶ NGUYÊN {c.from_tick} - {c.to_tick}</span>
                                    <span className="text-slate-600">|</span>
                                    <span className="text-slate-500">{new Date(c.created_at).toLocaleTimeString()}</span>
                                </div>
                                {c.perceived_archive_snapshot && (
                                    <span className={`text-[9px] px-1.5 rounded-sm border ${getClarityStyle(c.perceived_archive_snapshot.noise_level)}`}>
                                        {c.perceived_archive_snapshot.clarity}
                                    </span>
                                )}
                            </div>
                            <p className={`text-sm leading-relaxed font-serif italic transition-all duration-700 ${getContentStyle(c)}`}>
                                {c.content}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .epistemic-void {
                    filter: blur(2px);
                    opacity: 0.6;
                    text-shadow: 0 0 8px rgba(255,255,255,0.2);
                }
                .epistemic-mythic {
                    filter: blur(0.5px);
                    opacity: 0.8;
                    text-shadow: 0 0 4px rgba(245,158,11,0.2);
                }
                .epistemic-obscure {
                    opacity: 0.9;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: 10px;
                }
            `}</style>

            <div className="p-3 bg-slate-800/30 border-t border-slate-700/50 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Deep Observation Layer</span>
                <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse [animation-delay:200ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse [animation-delay:400ms]" />
                </div>
            </div>
        </div>
    );
};

function getClarityStyle(noise: number) {
    if (noise < 0.2) return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
    if (noise < 0.5) return 'border-blue-500/30 text-blue-400 bg-blue-500/5';
    if (noise < 0.8) return 'border-amber-500/30 text-amber-400 bg-amber-500/5';
    return 'border-red-500/30 text-red-400 bg-red-500/5';
}

function getContentStyle(c: Chronicle) {
    const noise = c.perceived_archive_snapshot?.noise_level || 0;
    if (noise > 0.8) return 'text-slate-500 epistemic-void';
    if (noise > 0.5) return 'text-amber-100/80 epistemic-mythic';
    if (noise > 0.2) return 'text-slate-300 epistemic-obscure';
    return 'text-slate-200';
}
