"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, Zap, ShieldCheck, Flame, Infinity } from 'lucide-react';

interface MetaEdict {
    id: string;
    name: string;
    decreed_by: string;
    target: string;
    multiplier: number;
}

import { useSimulation } from '@/context/SimulationContext';

export function UniversalLaw({ universeId }: { universeId: number }) {
    const { latestSnapshot, loading: contextLoading } = useSimulation();

    // Derive laws from the shared snapshot metrics
    const metrics = latestSnapshot?.metrics || {};
    const activeEdicts = metrics.active_edicts || {};
    const metaLaws = Object.values(activeEdicts).filter((e: unknown) => (e as any).is_meta === true) as MetaEdict[];

    const loading = contextLoading && !latestSnapshot;

    const getLawIcon = (id: string) => {
        if (id?.includes('reiki')) return <Zap className="w-4 h-4 text-emerald-400" />;
        if (id?.includes('tribulation')) return <Flame className="w-4 h-4 text-red-500" />;
        if (id?.includes('divine')) return <ShieldCheck className="w-4 h-4 text-blue-400" />;
        return <Scale className="w-4 h-4 text-amber-400" />;
    };

    return (
        <Card className="bg-slate-950/80 border-amber-500/30 backdrop-blur-2xl border-t-2 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-500/50 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />

            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black flex items-center gap-2 text-amber-500 uppercase tracking-[0.3em]">
                    <Scale className="w-3 h-3" />
                    Bảng Đạo Luật Tối Cao
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {metaLaws.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-600 gap-2">
                        <Infinity className="w-8 h-8 opacity-10" />
                        <p className="text-[9px] uppercase tracking-widest font-bold">Chưa có đạo luật vĩnh cửu</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {metaLaws.map(law => (
                            <div key={law.id} className="relative p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {getLawIcon(law.id)}
                                        <div>
                                            <h4 className="text-[11px] font-bold text-amber-200 uppercase tracking-wide">
                                                {law.name}
                                            </h4>
                                            <p className="text-[8px] text-amber-500/60 uppercase">
                                                Decreed by: {law.decreed_by}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-500 bg-amber-500/5 px-1 py-0 h-4 uppercase">
                                        Immortal
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[9px]">
                                    <span className="text-slate-500 uppercase">Hiệu ứng:</span>
                                    <span className="text-amber-400/80 font-mono">
                                        {law.target.toUpperCase()} x{law.multiplier}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
