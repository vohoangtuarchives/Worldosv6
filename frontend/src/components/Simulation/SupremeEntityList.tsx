"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Zap, Ghost, ShieldAlert, Cpu } from 'lucide-react';

interface SupremeEntity {
    id: number;
    name: string;
    entity_type: string;
    domain: string;
    description: string;
    power_level: number;
    alignment: Record<string, number>;
    status: string;
    ascended_at_tick: number;
}

import { useSimulation } from '@/context/SimulationContext';

export function SupremeEntityList({ universeId }: { universeId: number }) {
    const { supremeEntities: entities, loading: contextLoading } = useSimulation();
    const loading = contextLoading && entities.length === 0;

    if (loading && entities.length === 0) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-32 bg-slate-800/50 rounded-xl border border-white/5" />
            </div>
        );
    }

    if (entities.length === 0) return null;

    return (
        <Card className="bg-slate-900/80 border-amber-500/30 backdrop-blur-xl overflow-hidden shadow-2xl shadow-amber-900/20">
            <CardHeader className="pb-2 border-b border-amber-500/10 bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-amber-400 uppercase tracking-[0.2em]">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        Thực thể Tối cao
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-200 bg-amber-500/5">
                        MANIFESTED
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea>
                    <div className="divide-y divide-amber-500/10">
                        {entities.map(entity => (
                            <div key={entity.id} className="p-4 hover:bg-amber-500/5 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-black text-amber-100 uppercase tracking-tight">
                                                {entity.name}
                                            </h4>
                                            {getTypeIcon(entity.entity_type)}
                                        </div>
                                        <div className="text-[10px] text-amber-500/70 font-mono italic">
                                            {entity.domain}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono text-amber-400 font-bold">
                                            PWR: {entity.power_level.toFixed(2)}
                                        </div>
                                        <div className="text-[9px] text-slate-500 uppercase">
                                            Level
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-relaxed mb-3 line-clamp-2 italic">
                                    "{entity.description}"
                                </p>

                                {/* Alignment Visualization */}
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.entries(entity.alignment || {}) as [string, number][]).map(([dim, val]) => (
                                        <div key={dim} className="space-y-1">
                                            <div className="flex justify-between text-[8px] uppercase tracking-tighter text-slate-500">
                                                <span>{dim}</span>
                                                <span>{(val * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getAlignmentColor(dim)}`}
                                                    style={{ width: `${val * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-[8px] text-slate-600 font-mono text-right">
                                    Manifested at Tick #{entity.ascended_at_tick}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'world_will': return <Zap className="w-3 h-3 text-blue-400" />;
        case 'outer_god': return <Ghost className="w-3 h-3 text-purple-400" />;
        case 'ascended_hero': return <ShieldAlert className="w-3 h-3 text-amber-400" />;
        case 'primordial_beast': return <Ghost className="w-3 h-3 text-red-400" />;
        default: return <Cpu className="w-3 h-3 text-slate-400" />;
    }
}

function getAlignmentColor(dim: string) {
    const colors: Record<string, string> = {
        spirituality: 'bg-emerald-500',
        hardtech: 'bg-blue-500',
        entropy: 'bg-red-500',
        energy_level: 'bg-amber-500',
    };
    return colors[dim] || 'bg-slate-500';
}
