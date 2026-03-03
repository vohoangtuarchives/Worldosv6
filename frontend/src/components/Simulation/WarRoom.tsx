"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Swords, Gavel, Handshake, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DiplomaticRelation {
    status: 'WAR' | 'HOSTILE' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIANCE';
    friction: number;
    updated_at_tick: number;
    participants: [number, number];
}

export function WarRoom({ universeId }: { universeId: number }) {
    const [relations, setRelations] = useState<Record<string, DiplomaticRelation>>({});
    const [civs, setCivs] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch universe to get state_vector (diplomacy)
                const uniRes = await api.universe(universeId);
                const diplomacy = uniRes.data?.state_vector?.diplomacy || {};
                setRelations(diplomacy);

                // Fetch institutions to get civ names
                const instRes = await api.institutions(universeId);
                const civMap: Record<number, string> = {};
                (instRes || []).forEach((e: any) => {
                    if (e.entity_type === 'CIVILIZATION') {
                        civMap[e.id] = e.name;
                    }
                });
                setCivs(civMap);
            } catch (err) {
                console.error("WarRoom failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [universeId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'WAR': return <Swords className="w-4 h-4 text-red-500 animate-pulse" />;
            case 'HOSTILE': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'ALLIANCE': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
            case 'FRIENDLY': return <Handshake className="w-4 h-4 text-blue-400" />;
            default: return <Gavel className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAR': return 'border-red-500/50 bg-red-500/10 text-red-400';
            case 'HOSTILE': return 'border-orange-500/30 bg-orange-500/5 text-orange-400';
            case 'ALLIANCE': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';
            case 'FRIENDLY': return 'border-blue-500/30 bg-blue-500/5 text-blue-400';
            default: return 'border-white/10 bg-white/5 text-slate-400';
        }
    };

    return (
        <Card className="bg-slate-900/60 border-red-500/20 backdrop-blur-xl h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-white/5 bg-red-950/10">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-red-400 uppercase tracking-[0.2em]">
                    <Swords className="w-4 h-4" />
                    Bản đồ Chiến lược & Ngoại giao
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[450px] p-4">
                    {Object.keys(relations).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                            <Gavel className="w-12 h-12 opacity-10" />
                            <p className="text-[10px] uppercase font-bold tracking-widest text-center max-w-[200px]">
                                Chưa phát hiện xung đột hoặc thỏa ước ngoại giao cấp cao.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(relations).map(([key, rel]) => (
                                <div
                                    key={key}
                                    className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${getStatusColor(rel.status)}`}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(rel.status)}
                                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                                {rel.status}
                                            </span>
                                        </div>
                                        <div className="text-[9px] font-mono opacity-50">
                                            Friction: {(rel.friction * 100).toFixed(0)}%
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 text-center">
                                            <div className="text-[11px] font-bold truncate">
                                                {civs[rel.participants[0]] || `CIV #${rel.participants[0]}`}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                            <div className="w-12 h-[1px] bg-current" />
                                            <div className="text-[8px] font-mono">VS</div>
                                            <div className="w-12 h-[1px] bg-current" />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="text-[11px] font-bold truncate">
                                                {civs[rel.participants[1]] || `CIV #${rel.participants[1]}`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-white/5 text-[8px] opacity-40 uppercase font-bold text-center">
                                        Last Update: Tick #{rel.updated_at_tick}
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
