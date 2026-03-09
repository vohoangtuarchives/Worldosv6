"use client";

import React from "react";
import { type Snapshot } from "@/types/simulation";

interface MetricGridProps {
    snapshot: Snapshot | null;
    className?: string;
}

const FIVE_D_FIELDS = ["survival", "power", "wealth", "knowledge", "meaning"] as const;

export function MetricGrid({ snapshot, className }: MetricGridProps) {
    const metrics = snapshot?.metrics || {};
    const fields = (snapshot?.state_vector?.fields ?? {}) as Record<string, number>;

    const getMetric = (k: string) => {
        const v = metrics[k];
        return typeof v === "number" ? v : typeof v === "string" ? Number(v) : "--";
    };

    const statCards = [
        {
            label: "Entropy",
            value: snapshot?.entropy != null ? `${(snapshot.entropy * 100).toFixed(1)}%` : "--",
            desc: `Tick ${snapshot?.tick ?? "0"}`,
            color: "text-red-400",
        },
        {
            label: "Stability",
            value: snapshot?.stability_index != null ? `${(snapshot.stability_index * 100).toFixed(1)}%` : "--",
            desc: "Độ gắn kết hệ thống",
            color: "text-blue-400",
        },
        {
            label: "Complexity (SCI)",
            value: snapshot?.metrics?.sci != null ? `${(snapshot.metrics.sci * 100).toFixed(1)}%` : (snapshot?.sci != null ? `${(snapshot.sci * 100).toFixed(1)}%` : "--"),
            desc: "Độ phức tạp xã hội",
            color: "text-purple-400",
        },
        {
            label: "Knowledge",
            value: snapshot?.metrics?.knowledge != null ? `${(snapshot.metrics.knowledge * 100).toFixed(1)}%` : (snapshot?.state_vector?.knowledge != null ? `${(snapshot.state_vector.knowledge * 100).toFixed(1)}%` : "--"),
            desc: "Tiến bộ công nghệ",
            color: "text-emerald-400",
        },
        {
            label: "Material stress",
            value: metrics.material_stress != null ? `${(Number(metrics.material_stress) * 100).toFixed(1)}%` : "--",
            desc: "Áp lực vật chất",
            color: "text-amber-400",
        },
        {
            label: "Order",
            value: metrics.order != null ? `${(Number(metrics.order) * 100).toFixed(1)}%` : "--",
            desc: "Trật tự (1 − entropy)",
            color: "text-cyan-400",
        },
        {
            label: "Energy level",
            value: metrics.energy_level != null ? `${(Number(metrics.energy_level) * 100).toFixed(1)}%` : "--",
            desc: "Mức năng lượng",
            color: "text-green-400",
        },
    ];

    const has5D = FIVE_D_FIELDS.some((f) => typeof fields[f] === "number");

    return (
        <div className="space-y-3">
            <div className={className?.includes("grid") ? className : "grid gap-4 md:grid-cols-2 lg:grid-cols-4"}>
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm transition-all hover:bg-muted/60 hover:border-border group">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-xs font-medium text-muted-foreground uppercase">{card.label}</h3>
                        </div>
                        <div className={`text-2xl font-bold font-mono tracking-tighter ${card.color} group-hover:scale-105 transition-transform origin-left`}>
                            {card.value}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono">{card.desc}</p>
                    </div>
                ))}
            </div>
            {has5D && (
                <div className="rounded-lg border border-border bg-card/60 p-3">
                    <h3 className="text-[10px] font-medium text-muted-foreground uppercase mb-2">5D fields (phase space)</h3>
                    <div className="flex flex-wrap gap-2">
                        {FIVE_D_FIELDS.map((f) => {
                            const v = typeof fields[f] === "number" ? fields[f] : 0.5;
                            return (
                                <div key={f} className="flex items-center gap-1.5 min-w-[80px]">
                                    <span className="text-[10px] text-muted-foreground capitalize w-14 truncate">{f}</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary/70 rounded-full" style={{ width: `${v * 100}%` }} />
                                    </div>
                                    <span className="text-[9px] font-mono text-foreground w-6">{(v * 100).toFixed(0)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
