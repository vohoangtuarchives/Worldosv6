"use client";

import React from "react";
import { type Snapshot } from "@/types/simulation";

interface MetricGridProps {
    snapshot: Snapshot | null;
    className?: string;
}

export function MetricGrid({ snapshot, className }: MetricGridProps) {
    const metrics = snapshot?.metrics || {};

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
            label: "Stability Index",
            value: snapshot?.stability_index != null ? snapshot.stability_index.toFixed(2) : "--",
            desc: "Relative order",
            color: "text-blue-400",
        },
        {
            label: "Order",
            value: getMetric("order") !== "--" ? `${(getMetric("order") as number * 100).toFixed(1)}%` : "--",
            desc: "Universal coherence",
            color: "text-cyan-400",
        },
        {
            label: "Energy Level",
            value: getMetric("energy_level") !== "--" ? `${(getMetric("energy_level") as number * 100).toFixed(1)}%` : "--",
            desc: "Ascension progress",
            color: "text-yellow-400",
        },
    ];

    return (
        <div className={className || "grid gap-4 md:grid-cols-2 lg:grid-cols-4"}>
            {statCards.map((card) => (
                <div key={card.label} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm transition-all hover:bg-slate-800/60 hover:border-slate-700 group">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs font-medium text-slate-500 uppercase">{card.label}</h3>
                    </div>
                    <div className={`text-2xl font-bold font-mono tracking-tighter ${card.color} group-hover:scale-105 transition-transform origin-left`}>
                        {card.value}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 font-mono">{card.desc}</p>
                </div>
            ))}
        </div>
    );
}
