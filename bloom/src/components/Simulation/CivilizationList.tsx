"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Users, ShieldAlert } from 'lucide-react';

interface Civilization {
    id: number;
    name: string;
    entity_type: string;
    org_capacity: number;
    legitimacy: number;
    ideology_vector: Record<string, number>;
    influence_map: number[];
    spawned_at_tick: number;
}

import { useSimulation } from '@/context/SimulationContext';
import { Institution } from '@/types/simulation';

export function CivilizationList({ universeId }: { universeId: number }) {
    const { institutions } = useSimulation();

    // Filter specifically for civilizations from the shared context
    const civs = (institutions || []).filter((e: Institution) => e.entity_type === 'CIVILIZATION');
    const loading = institutions.length === 0;

    if (loading && civs.length === 0) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-slate-800/50 rounded-xl border border-white/5" />
                ))}
            </div>
        );
    }

    return (
        <Card className="bg-slate-900/60 border-indigo-500/20 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 border-b border-indigo-500/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-widest">
                        <Globe className="w-4 h-4" />
                        Nền văn minh Nổi sinh
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                        {civs.length} Active
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    {civs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                            <ShieldAlert className="w-8 h-8 opacity-20" />
                            <p className="text-xs italic">Chưa phát hiện cụm văn hóa đủ lớn để hình thành văn minh.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {civs.map(civ => (
                                <div key={civ.id} className="p-4 hover:bg-white/5 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                                {civ.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                    <Users className="w-3 h-3" />
                                                    <span>{civ.influence_map?.length || 0} Phân vùng</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                <div className="text-[10px] text-slate-500">
                                                    Khởi thủy: Tick #{civ.spawned_at_tick}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono text-indigo-400">
                                                {((civ.org_capacity ?? 0) * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-[9px] uppercase tracking-tighter text-slate-500">
                                                Capacity
                                            </div>
                                        </div>
                                    </div>

                                    {/* Governance/Legitimacy */}
                                    <div className="space-y-1 mb-3">
                                        <div className="flex justify-between text-[9px] text-slate-400">
                                            <span>Chính danh (Legitimacy)</span>
                                            <span>{((civ.legitimacy ?? 0) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-500"
                                                style={{ width: `${(civ.legitimacy ?? 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Cultural Fingerprint */}
                                    <div className="grid grid-cols-5 gap-1 pt-1">
                                        {(Object.entries(civ.ideology_vector || {}) as [string, number][]).map(([key, val]) => (
                                            <div
                                                key={key}
                                                className="h-1 rounded-sm bg-slate-800 overflow-hidden"
                                                title={`${key}: ${(val * 100).toFixed(1)}%`}
                                            >
                                                <div
                                                    className={`h-full ${getCultureColor(key)}`}
                                                    style={{ width: `${val * 100}%` }}
                                                />
                                            </div>
                                        ))}
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

function getCultureColor(key: string): string {
    const colors: Record<string, string> = {
        tradition_rigidity: 'bg-orange-500',
        innovation_openness: 'bg-emerald-500',
        collective_trust: 'bg-blue-500',
        violence_tolerance: 'bg-red-500',
        institutional_respect: 'bg-indigo-500',
    };
    return colors[key] || 'bg-slate-400';
}
