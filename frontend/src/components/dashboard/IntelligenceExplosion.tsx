"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BrainCircuit, Beaker } from "lucide-react";

import { api } from "@/lib/api";

export default function IntelligenceExplosion() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.labDashboard.intelligence()
            .then((json: any) => setData(json))
            .catch((err: any) => console.error("Failed to load intelligence", err));
    }, []);

    if (!data) return <div className="h-full flex items-center justify-center animate-pulse text-zinc-500">Extracting Laws...</div>;

    return (
        <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-fuchsia-400" />
                        Meta-Learning Engine
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">Self-modifying physical laws & AI discovery.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                    <div className="text-zinc-500 text-xs uppercase font-semibold mb-1">Laws Discovered</div>
                    <div className="text-3xl font-mono text-white">{data.laws_discovered}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                    <div className="text-zinc-500 text-xs uppercase font-semibold mb-1">Max Fitness</div>
                    <div className="text-3xl font-mono text-fuchsia-400">{data.best_model_fitness.toFixed(3)}</div>
                </div>
            </div>

            <div className="flex-grow min-h-[180px] w-full relative">
                <div className="absolute top-0 left-0 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Generational Fitness</div>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.improvement_curve} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="generation" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px", fontSize: "12px" }}
                            itemStyle={{ color: "#d946ef" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="fitness"
                            stroke="#d946ef"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#09090b", stroke: "#d946ef", strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
