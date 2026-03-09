"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    Flame,
    Shield,
    Zap,
    Infinity as InfinityIcon,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useSimulation } from '@/context/SimulationContext';

interface Epoch {
    id: number;
    name: string;
    theme: string;
    description: string;
    start_tick: number;
    axiom_modifiers: Record<string, number>;
}

export function EpochNavigator({ universeId }: { universeId: number }) {
    const [currentEpoch, setCurrentEpoch] = useState<Epoch | null>(null);
    const [tick, setTick] = useState(0);
    const [loading, setLoading] = useState(true);
    const { latestSnapshot } = useSimulation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.universe(universeId);
                const world = res.data?.world;
                if (world && world.epochs) {
                    const active = world.epochs.find((e: any) => e.status === 'active');
                    setCurrentEpoch(active || null);
                }
                setTick(res.data?.latest_snapshot?.tick || 0);
            } catch (err) {
                console.error("Failed to fetch Epoch details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [universeId, latestSnapshot?.tick]);

    const getThemeConfig = (theme: string) => {
        switch (theme.toLowerCase()) {
            case 'chaos': return { icon: <Flame className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
            case 'order': return { icon: <Shield className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
            case 'light': return { icon: <Zap className="w-4 h-4" />, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
            case 'genesis': return { icon: <InfinityIcon className="w-4 h-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
            default: return { icon: <Clock className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>;
    if (!currentEpoch) return null;

    const theme = getThemeConfig(currentEpoch.theme);
    const progress = Math.min(((tick - currentEpoch.start_tick) / 10000) * 100, 100);

    return (
        <Card className="bg-black/60 border-white/5 backdrop-blur-3xl overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${theme.color.replace('text', 'bg')}`} />

            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme.bg} ${theme.border} border`}>
                            {theme.icon}
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{currentEpoch.name}</h3>
                            <p className="text-[9px] text-slate-500 font-medium">THỜI ĐẠI HIỆN TẠI</p>
                        </div>
                    </div>
                    <Badge variant="outline" className={`text-[8px] uppercase tracking-tighter ${theme.color} ${theme.border}`}>
                        {currentEpoch.theme}
                    </Badge>
                </div>

                <p className="text-[10px] text-slate-400 italic mb-4 leading-relaxed line-clamp-2">
                    "{currentEpoch.description}"
                </p>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Tiến trình Kỷ nguyên</span>
                            <span className="text-[9px] font-mono text-slate-400">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(currentEpoch.axiom_modifiers).map(([key, val]) => (
                            <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                                <span className="text-[8px] text-slate-500 font-mono uppercase truncate">{key.replace('_', ' ')}</span>
                                <span className="text-[10px] text-white font-black">×{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-2.5 h-2.5" />
                        KHỞI ĐẦU: TICK {currentEpoch.start_tick}
                    </div>
                    <div className="group flex items-center gap-1 cursor-help hover:text-slate-400 transition-colors">
                        Lịch sử vĩ mô <ChevronRight className="w-2 h-2" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
