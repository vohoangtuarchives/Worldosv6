"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSimulation } from '@/context/SimulationContext';

interface Institution {
    id: number;
    name: string;
    type: string;
    capacity: number;
    legitimacy: number;
    ideology: Record<string, number>;
    memory: number;
}

export default function FactionList({ universeId }: { universeId: number }) {
    const [factions, setFactions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const { latestSnapshot } = useSimulation();

    useEffect(() => {
        const fetchFactions = async () => {
            try {
                setLoading(true);
                const res = await api.institutions(universeId);
                const list = Array.isArray(res) ? res : (res && typeof res === "object" && "data" in res ? (res as { data: Institution[] }).data : []);
                setFactions(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Failed to fetch factions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFactions();
    }, [universeId, latestSnapshot?.tick]);

    if (loading && factions.length === 0) {
        return (
            <div className="p-4 animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/5 rounded border border-white/10" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 sticky top-0 bg-card/80 backdrop-blur pb-2 z-10 border-b border-blue-500/30">
                Trường thể chế
            </h3>

            {factions.length === 0 && (
                <div className="text-center py-8 text-white/30 text-xs italic">
                    Chưa phát hiện phe chủ đạo trong kỷ nguyên này.
                </div>
            )}

            {factions.map(faction => (
                <div
                    key={faction.id}
                    className="group relative p-3 bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-lg transition-all duration-300 overflow-hidden"
                >
                    {/* Capacity Progress Bar Background */}
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-blue-500/20"
                        style={{ width: `${Math.min(100, faction.capacity)}%` }}
                    />

                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                {faction.name}
                            </div>
                            <div className="text-[10px] uppercase tracking-tighter text-white/50">
                                {faction.type} • Hợp thức: {(faction.legitimacy * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-mono text-blue-400">
                                Sức chứa: {faction.capacity.toFixed(1)}
                            </div>
                            <div className="text-[10px] text-white/40">
                                Bộ nhớ: {faction.memory.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Ideology Vectors */}
                    <div className="flex gap-1 mt-2">
                        {Object.entries(faction.ideology || {}).map(([key, val]) => (
                            <div
                                key={key}
                                title={`${key}: ${val.toFixed(2)}`}
                                className="flex-1 h-1 bg-white/10 relative overflow-hidden rounded-full"
                            >
                                <div
                                    className={`absolute left-0 top-0 h-full ${getIdeologyColor(key)}`}
                                    style={{ width: `${val * 100}%` }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getIdeologyColor(key: string): string {
    const colors: Record<string, string> = {
        tradition: 'bg-orange-500',
        innovation: 'bg-emerald-500',
        trust: 'bg-blue-500',
        violence: 'bg-red-500',
        respect: 'bg-purple-500',
        myth: 'bg-yellow-500',
    };
    return colors[key] || 'bg-white/40';
}
