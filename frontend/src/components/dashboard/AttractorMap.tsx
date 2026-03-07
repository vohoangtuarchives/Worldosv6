"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Globe2, AlertTriangle } from "lucide-react";

import { api } from "@/lib/api";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AttractorMap() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.labDashboard.attractors()
            .then((json: any) => setData(json))
            .catch((err: any) => console.error("Failed to load attractors", err));
    }, []);

    if (!data) return <div className="h-full flex items-center justify-center animate-pulse text-slate-500">Scanning Topologies...</div>;

    return (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-lg p-6 h-full flex flex-col">
            <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-blue-400" />
                    Attractor Topology
                </h2>
                <p className="text-slate-400 text-sm mt-1">Regime basins and dark traps.</p>
            </div>

            <div className="flex-grow mt-6 min-h-[220px] relative">
                {data.basins.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.basins}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.basins.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                                itemStyle={{ color: "#f8fafc" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-slate-500 text-sm">Insufficient Memory Depth</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs text-slate-500 uppercase font-semibold mb-3">Strange & Dark Rules</h3>
                <div className="flex flex-col gap-2">
                    {data.active_rules.slice(0, 3).map((rule: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-800/60">
                            <span className="text-slate-300 truncate max-w-[180px]">{rule.name}</span>
                            {rule.is_dark ? (
                                <span className="flex items-center gap-1 text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" /> TRAP
                                </span>
                            ) : (
                                <span className="text-blue-400 text-xs bg-blue-400/10 px-2 py-0.5 rounded">STRANGE</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
