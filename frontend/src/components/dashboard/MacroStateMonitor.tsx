"use client";

import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import { useSimulation } from "@/context/SimulationContext";

export default function MacroStateMonitor() {
    const { universeId } = useSimulation();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.labDashboard.state(universeId ?? undefined)
            .then((json: any) => setData(json))
            .catch((err: any) => console.error("Failed to load macro state", err));
    }, [universeId]);

    if (!data) return <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Loading State...</div>;

    const chartData = [
        { subject: "Tri thức", A: (data.tech ?? 0) * 100, fullMark: 100 },
        { subject: "Quân sự", A: (data.militarism ?? 0) * 100, fullMark: 100 },
        { subject: "Di sản", A: (data.legacy ?? 0) * 100, fullMark: 100 },
        { subject: "Ổn định", A: (data.stability ?? 0) * 100, fullMark: 100 },
        { subject: "Định chế", A: (data.institutional ?? 0) * 100, fullMark: 100 },
        { subject: "Tâm linh", A: (data.spirituality ?? 0) * 100, fullMark: 100 },
        { subject: "Đổi mới", A: (data.innovation ?? 0) * 100, fullMark: 100 },
        { subject: "Hỗn độn", A: (data.entropy ?? 0) * 100, fullMark: 100 },
    ];

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group">
            {/* Glossy background effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-colors duration-500" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 glow-emerald">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        Thực Trạng Văn Minh
                    </h2>
                    <p className="text-muted-foreground text-xs mt-1 font-medium uppercase tracking-wider opacity-70">Phase Space Coordinates</p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">CHRONOS TICK</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{data.tick}</div>
                </div>
            </div>

            <div className="flex-grow min-h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            tick={false} 
                            axisLine={false} 
                        />
                        <Radar
                            name="Nhân Quả Hiện Tại"
                            dataKey="A"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#radarGradient)"
                            fillOpacity={0.6}
                        />
                        <defs>
                            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0.2}/>
                            </linearGradient>
                        </defs>
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center text-[10px] font-bold tracking-wider">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground uppercase opacity-60">Độ nhòe Tri thức</span>
                    <span className={`px-2 py-0.5 rounded border ${
                        (data.noise ?? 0) > 0.5 ? "text-red-400 border-red-500/30 bg-red-500/5" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                    }`}>
                        {data.clarity ?? "Chân Thực"} ({((data.noise ?? 0) * 100).toFixed(1)}%)
                    </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-muted-foreground uppercase opacity-60">Cổ mẫu thống trị</span>
                    <span className="px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)] uppercase tracking-widest font-mono">
                        {data.winner}
                    </span>
                </div>
            </div>
        </div>
    );
}
