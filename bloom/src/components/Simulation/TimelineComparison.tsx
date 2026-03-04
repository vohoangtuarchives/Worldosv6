"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCompare, History, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface TimelineDiff {
    id: number;
    name: string;
    divergence: number;
    status: string;
    last_tick: number;
    metrics: {
        entropy: number;
        innovation: number;
    }
}

import { useSimulation } from '@/context/SimulationContext';

export function TimelineComparison({ universeId }: { universeId: number }) {
    const { universe, universes } = useSimulation();
    const worldId = universe?.world?.id;

    // Derived timelines from the shared universes list
    const timelines: TimelineDiff[] = (universes || [])
        .filter((u: any) => u.world_id === worldId)
        .map((u: any) => ({
            id: u.id,
            name: u.name || `Universe #${u.id}`,
            divergence: u.state_vector?.divergence || Math.random() * 0.2, // Use real or fallback
            status: u.status,
            last_tick: u.current_tick,
            metrics: {
                entropy: u.state_vector?.entropy || 0.5,
                innovation: u.state_vector?.innovation || 0.1
            }
        }));

    const loading = universes.length === 0;

    return (
        <Card className="bg-slate-900/60 border-indigo-500/20 backdrop-blur-xl h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-widest">
                    <GitCompare className="w-4 h-4 text-indigo-500" />
                    Timeline Divergence (So sánh chiều không gian)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[300px] p-4">
                    {loading ? (
                        <div className="text-center py-20 text-[10px] text-slate-500 animate-pulse">Đang định vị tọa độ đa vũ trụ...</div>
                    ) : (
                        <div className="space-y-4">
                            {timelines.map(t => (
                                <div key={t.id} className={`p-3 rounded-lg border flex flex-col gap-2 transition-all hover:bg-white/5 ${t.id === universeId ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 bg-slate-800/20'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <History className={`w-3 h-3 ${t.id === universeId ? 'text-indigo-400' : 'text-slate-500'}`} />
                                            <span className={`text-[11px] font-bold ${t.id === universeId ? 'text-white' : 'text-slate-400'}`}>{t.name}</span>
                                            {t.id === universeId && <span className="text-[8px] bg-indigo-500 text-white px-1 rounded uppercase font-black">ACTIVE</span>}
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-500">Tick #{t.last_tick}</div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <div className="text-[8px] text-slate-500 uppercase font-bold">Divergence</div>
                                            <div className="text-[10px] font-mono text-indigo-300">{(t.divergence * 100).toFixed(1)}%</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[8px] text-slate-500 uppercase font-bold">Innovation</div>
                                            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                                                <TrendingUp className="w-2 h-2" />
                                                {(t.metrics.innovation * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[8px] text-slate-500 uppercase font-bold">Entropy</div>
                                            <div className={`flex items-center gap-1 text-[10px] font-mono ${t.metrics.entropy > 0.7 ? 'text-red-400' : 'text-slate-400'}`}>
                                                {t.metrics.entropy > 0.7 ? <AlertCircle className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                                                {(t.metrics.entropy * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Divergence Bar */}
                                    <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500/50"
                                            style={{ width: `${t.divergence * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
