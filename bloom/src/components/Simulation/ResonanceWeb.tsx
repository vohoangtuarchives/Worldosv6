"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Cpu,
    Share2,
    Zap,
    Link as LinkIcon,
    RefreshCw,
    Loader2
} from 'lucide-react';

interface Interaction {
    id: number;
    universe_a_id: number;
    universe_b_id: number;
    resonance_level: number;
    synchronicity_score: number;
    universe_a?: { name: string };
    universe_b?: { name: string };
}

import { useSimulation } from '@/context/SimulationContext';

export function ResonanceWeb({ universeId }: { universeId: number }) {
    const { interactions, loading: contextLoading } = useSimulation();
    const loading = contextLoading && interactions.length === 0;

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>;
    if (interactions.length === 0) return null;

    return (
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl border-dashed">
            <CardHeader className="p-3 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    Mạng Lưới Cộng Hưởng (Resonance Web)
                </CardTitle>
                <div className="flex gap-1">
                    <RefreshCw className="w-2.5 h-2.5 text-slate-600 animate-spin-slow" />
                </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
                {interactions.map((interaction) => {
                    const level = Math.round((interaction.resonance_level ?? 0) * 100);
                    const isHigh = (interaction.resonance_level ?? 0) > 0.8;

                    return (
                        <div key={interaction.id} className="relative group">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-slate-600'}`} />
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                                        Uni_{interaction.universe_a_id ?? '?'} ↔ Uni_{interaction.universe_b_id ?? '?'}
                                    </span>
                                </div>
                                <Badge variant="outline" className={`text-[8px] font-mono ${isHigh ? 'text-blue-400 border-blue-400/30' : 'text-slate-500 border-white/5'}`}>
                                    {level}% SYNC
                                </Badge>
                            </div>

                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${isHigh ? 'bg-gradient-to-r from-blue-600 to-cyan-400' : 'bg-slate-700'}`}
                                    style={{ width: `${level}%` }}
                                />
                            </div>

                            {isHigh && (
                                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Zap className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                                    <span className="text-[8px] text-blue-400/80 font-black uppercase tracking-widest italic">
                                        Reality Bleeding Active
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[8px] text-slate-600 font-bold uppercase">
                        <LinkIcon className="w-2.5 h-2.5" />
                        Tổng số nút: {interactions.length}
                    </div>
                    <Cpu className="w-3 h-3 text-slate-700" />
                </div>
            </CardContent>
        </Card>
    );
}
