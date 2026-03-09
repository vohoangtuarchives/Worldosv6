"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, AlertOctagon, TrendingDown, ThermometerSnowflake } from "lucide-react";

import { api } from "@/lib/api";

export default function RiskAlerts() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.labDashboard.risks()
            .then((json: any) => setData(json))
            .catch((err: any) => console.error("Failed to load risks", err));
    }, []);

    if (!data) return <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Simulating Futures...</div>;

    const getRiskColor = (val: number) => {
        if (val > 0.7) return "text-red-500";
        if (val > 0.4) return "text-amber-500";
        return "text-emerald-500";
    };

    const getRiskBg = (val: number) => {
        if (val > 0.7) return "bg-red-500/10 border-red-500/20";
        if (val > 0.4) return "bg-amber-500/10 border-amber-500/20";
        return "bg-emerald-500/10 border-emerald-500/20";
    };

    const getIcon = (name: string) => {
        if (name.includes("Collapse")) return <TrendingDown className="w-4 h-4" />;
        if (name.includes("Heat Death")) return <ThermometerSnowflake className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    return (
        <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-red-500" />
                        Existential Risks
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">Multi-scenario predictive simulator.</p>
                </div>
                {data.active_alerts.length > 0 && (
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-4 flex-grow">
                {data.indicators.map((ind: any, idx: number) => (
                    <div key={idx} className="relative">
                        <div className={`flex justify-between mb-1 ${getRiskColor(ind.value)}`}>
                            <span className="text-sm font-medium flex items-center gap-1.5">
                                {getIcon(ind.name)} {ind.name}
                            </span>
                            <span className="text-sm font-bold font-mono">{(ind.value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${ind.value > 0.7 ? 'bg-red-500' : ind.value > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-1000 ease-out`}
                                style={{ width: `${ind.value * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {data.active_alerts.length > 0 && (
                <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    <div className="font-bold mb-1">SYSTEM ALERT:</div>
                    <ul className="list-disc pl-4 space-y-1">
                        {data.active_alerts.map((alert: string, i: number) => (
                            <li key={i}>{alert}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
