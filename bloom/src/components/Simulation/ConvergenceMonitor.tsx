'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Zap } from 'lucide-react';

interface Trajectory {
    id: number;
    phenomenon_description: string;
    probability: number;
    target_tick: number;
    convergence_type: string;
}

interface ConvergenceMonitorProps {
    universeId: number;
    currentTick: number;
}

import { useSimulation } from '@/context/SimulationContext';

const ConvergenceMonitor: React.FC<ConvergenceMonitorProps> = ({ universeId, currentTick }) => {
    const { trajectories, loading } = useSimulation();
    const isDataEmpty = !trajectories || trajectories.length === 0;

    if (loading && trajectories.length === 0) return null;

    return (
        <Card className="bg-slate-950/80 border-cyan-900/50 backdrop-blur-md">
            <CardHeader className="py-2 px-4 border-b border-cyan-900/30">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-cyan-400 uppercase tracking-widest">
                    <Target className="w-4 h-4" />
                    Giám sát Hội tụ Nhân quả
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {trajectories.length === 0 ? (
                    <div className="text-[10px] text-slate-500 italic text-center py-4">
                        Chưa phát hiện điểm hội tụ nhân quả đáng kể...
                    </div>
                ) : (
                    trajectories.map((traj) => {
                        const remainingTicks = (traj.target_tick ?? currentTick) - currentTick;
                        const probabilityPercent = Math.round((traj.probability ?? 0) * 100);

                        return (
                            <div key={traj.id} className="space-y-2 border-l-2 border-cyan-800 pl-3 py-1">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-[11px] font-semibold text-cyan-100 leading-tight">
                                        {traj.phenomenon_description ?? '—'}
                                    </span>
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-bold">
                                        {(traj.convergence_type ?? '').replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                                        <span>Xác suất hội tụ</span>
                                        <span className="text-cyan-400 font-mono">{probabilityPercent}%</span>
                                    </div>
                                    <Progress value={probabilityPercent} className="h-1 bg-slate-900" />
                                </div>

                                <div className="flex items-center justify-between text-[9px]">
                                    <div className="flex items-center gap-1 text-slate-500 font-bold">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <span>Giao điểm: Tick {traj.target_tick ?? '?'}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${remainingTicks < 20 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                                        Δt: {remainingTicks > 0 ? `-${remainingTicks}` : 'Hội tụ'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};

export default ConvergenceMonitor;
