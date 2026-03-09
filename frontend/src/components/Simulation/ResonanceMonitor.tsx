"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Waves, Zap, Share2 } from 'lucide-react';
import { useSimulation } from '@/context/SimulationContext';

export function ResonanceMonitor({ universeId }: { universeId: number }) {
    const [resonance, setResonance] = useState<number>(0);
    const { latestSnapshot } = useSimulation();

    useEffect(() => {
        const fetchResonance = async () => {
            try {
                const res = await api.universe(universeId);
                const val = res.data?.state_vector?.meta_resonance || 0;
                setResonance(val);
            } catch (err) {
                console.error("Failed to fetch resonance:", err);
            }
        };

        fetchResonance();
    }, [universeId, latestSnapshot?.tick]);

    const getResonanceColor = (val: number) => {
        if (val > 0.8) return "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]";
        if (val > 0.5) return "bg-blue-400";
        return "bg-muted-foreground/50";
    };

    return (
        <Card className="bg-card/40 border-cyan-500/20 backdrop-blur-md overflow-hidden transition-all hover:bg-card/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Waves className={`w-3 h-3 ${resonance > 0.5 ? 'animate-pulse' : ''}`} />
                        Meta-Universe Resonance
                    </div>
                    <span className="font-mono">{Math.round(resonance * 100)}%</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={resonance * 100} className="h-1 bg-muted" />
                <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <Zap className={`w-3 h-3 ${resonance > 0.7 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">Innovation Boost</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Share2 className={`w-3 h-3 ${resonance > 0.4 ? 'text-blue-400' : 'text-muted-foreground'}`} />
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">Timeline Sync</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            {resonance > 0.8 && (
                <div className="bg-cyan-500/10 px-4 py-1 text-[8px] text-cyan-300 animate-pulse text-center uppercase tracking-widest border-t border-cyan-500/20">
                    Sóng cộng hưởng cực đại - Khả năng hội tụ thực tại đang diễn ra
                </div>
            )}
        </Card>
    );
}
