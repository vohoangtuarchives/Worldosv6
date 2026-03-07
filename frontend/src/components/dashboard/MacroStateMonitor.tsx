"use client";

import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ShieldAlert, Cpu, HeartPulse, Scale, Activity } from "lucide-react";

import { api } from "@/lib/api";

export default function MacroStateMonitor() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.labDashboard.state()
            .then((json: any) => setData(json))
            .catch((err: any) => console.error("Failed to load macro state", err));
    }, []);

    if (!data) return <div className="h-full flex items-center justify-center animate-pulse text-slate-500">Loading State...</div>;

    const chartData = [
        { subject: "Knowledge (Tech)", A: data.tech * 100, fullMark: 100 },
        { subject: "Stability", A: data.stability * 100, fullMark: 100 },
        { subject: "Coercion", A: data.coercion * 100, fullMark: 100 },
        { subject: "Entropy", A: data.entropy * 100, fullMark: 100 },
        { subject: "Complexity", A: data.sci * 100, fullMark: 100 },
    ];

    return (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-lg p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        Civilization State
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Current coordinates in phase space.</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-semibold">TICK</div>
                    <div className="text-2xl font-mono text-emerald-400">{data.tick}</div>
                </div>
            </div>

            <div className="flex-grow min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Current State"
                            dataKey="A"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
                <div className="text-slate-400">Emergent Winner:</div>
                <div className="px-3 py-1 bg-slate-800/60 border border-slate-700 rounded-full text-slate-200 font-medium font-mono text-xs shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    {data.winner}
                </div>
            </div>
        </div>
    );
}
