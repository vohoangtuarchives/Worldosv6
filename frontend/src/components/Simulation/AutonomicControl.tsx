"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Settings2, GitBranch, Zap, Activity } from 'lucide-react';

interface AutonomicLog {
    id: number;
    type: string;
    action: string;
    details: string;
    tick: number;
    timestamp: string;
}

import { useSimulation } from '@/context/SimulationContext';

export function AutonomicControl({ universeId: _unusedId, axioms: _unusedAxioms }: { universeId: number, axioms: Record<string, any> }) {
    const { chronicles, universe, loading: contextLoading, isPaused, setIsPaused } = useSimulation();
    const axioms = universe?.world?.axiom || {};

    // Derive autonomic logs from chronicles
    const logs = (chronicles || [])
        .filter((c: any) => c.type === 'myth' || c.type === 'convergence_event' || (c.content && c.content.includes('THIÊN ĐẠO')))
        .map((c: any) => ({
            id: c.id,
            type: c.type === 'myth' ? 'AXIOM_SHIFT' : 'DECISION',
            action: (c.content && c.content.includes('NGHỊCH LÝ')) ? 'PARADOX' : 'REGULATE',
            details: c.content,
            tick: c.from_tick,
            timestamp: c.created_at
        }));

    const loading = contextLoading && chronicles.length === 0;

    return (
        <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
            <CardHeader className="pb-2 border-b border-cyan-500/10 bg-gradient-to-r from-cyan-500/10 to-transparent">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-cyan-400 uppercase tracking-[0.2em]">
                        <Brain className="w-4 h-4 animate-pulse" />
                        Linh Cơ & Thiên Đạo
                    </CardTitle>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold transition-all duration-300 ${isPaused
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 opacity-60 hover:opacity-100'}`}
                        >
                            <Zap className={`w-3 h-3 ${isPaused ? '' : 'animate-pulse'}`} />
                            {isPaused ? 'SYNC PAUSED' : 'SYNC ACTIVE'}
                        </button>
                        <Badge variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-200">
                            AUTONOMIC: ON
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {/* Active Axioms Status */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {Object.entries(axioms).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/40 p-2 rounded border border-white/5">
                            <div className="text-[8px] text-slate-500 uppercase font-mono">{key.replace('_', ' ')}</div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-cyan-100">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                <Activity className="w-3 h-3 text-cyan-500/50" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Settings2 className="w-3 h-3" />
                    Lịch sử Quyết định Tự trị
                </div>

                <ScrollArea className="h-[180px] rounded-md border border-white/5 bg-black/20 p-2">
                    {loading && logs.length === 0 ? (
                        <div className="text-center py-8 text-[10px] text-slate-500 animate-pulse">Đang đồng bộ luồng ý thức...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-[10px] text-slate-500 italic">Chưa có quyết định tự trị nào được ghi nhận.</div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="text-[10px] border-l-2 border-cyan-500/30 pl-3 py-1 hover:bg-white/5 transition-colors group">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-black tracking-tighter ${log.action === 'PARADOX' ? 'text-red-400' : 'text-cyan-400'}`}>
                                                [{log.type}]
                                            </span>
                                            <span className="text-slate-500 text-[8px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <span className="text-slate-600 font-mono text-[9px]">T#{log.tick}</span>
                                    </div>
                                    <div className="text-slate-300 leading-tight group-hover:text-white transition-colors">
                                        {log.details}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-slate-600 font-mono">
                    <div className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        <span>Branch Limit: 1</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Axiom Shift: Enabled</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
