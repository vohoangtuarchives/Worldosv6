"use client";

import React, { useMemo } from "react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { Activity, Zap, Coins, BookOpen, Heart } from "lucide-react";

interface PhaseSpaceChartProps {
    fields: {
        survival?: number;
        power?: number;
        wealth?: number;
        knowledge?: number;
        meaning?: number;
    } | null;
}

const FIELD_METADATA = [
    { key: "survival", label: "Survival", icon: Activity, color: "#10b981", description: "Cơ sở tồn tại & An ninh" },
    { key: "power", label: "Power", icon: Zap, color: "#f59e0b", description: "Quyền lực & Kiểm soát" },
    { key: "wealth", label: "Wealth", icon: Coins, color: "#fbbf24", description: "Tài sản & Kinh tế" },
    { key: "knowledge", label: "Knowledge", icon: BookOpen, color: "#3b82f6", description: "Tri thức & Công nghệ" },
    { key: "meaning", label: "Meaning", icon: Heart, color: "#ec4899", description: "Ý nghĩa & Tâm linh" },
];

export function PhaseSpaceChart({ fields }: PhaseSpaceChartProps) {
    const data = useMemo(() => {
        if (!fields) return FIELD_METADATA.map(m => ({ subject: m.label, value: 0, full: 1 }));

        return FIELD_METADATA.map(m => ({
            subject: m.label,
            value: fields[m.key as keyof typeof fields] ?? 0.1,
            full: 1
        }));
    }, [fields]);

    if (!fields) {
        return (
            <div className="h-[300px] flex items-center justify-center text-slate-600 font-mono text-xs italic">
                AWAITING CIVILIZATION SIGNATURE...
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-blue-500/20 bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-500/20 bg-gradient-to-r from-slate-900 to-blue-950/20">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-mono text-blue-400 uppercase tracking-wider">Civilization Phase Space</span>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                            <Radar
                                name="Civilization Field"
                                dataKey="value"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.4}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: '#3b82f6' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                    {FIELD_METADATA.map((m) => {
                        const val = fields[m.key as keyof typeof fields] ?? 0;
                        return (
                            <div key={m.key} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                                    <div className="flex items-center gap-1.5 text-slate-300">
                                        <m.icon className="w-3 h-3" style={{ color: m.color }} />
                                        <span>{m.label}</span>
                                    </div>
                                    <span style={{ color: m.color }}>{(val * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-1000 ease-out"
                                        style={{ width: `${val * 100}%`, backgroundColor: m.color }}
                                    />
                                </div>
                                <span className="text-[8px] text-slate-500 italic leading-tight">{m.description}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
