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
            label: "Stability",
            value: snapshot?.stability_index != null ? `${(snapshot.stability_index * 100).toFixed(1)}%` : "--",
            desc: "System coherence",
            color: "text-blue-400",
        },
        {
            label: "Complexity (SCI)",
            value: snapshot?.metrics?.sci != null ? `${(snapshot.metrics.sci * 100).toFixed(1)}%` : (snapshot?.sci != null ? `${(snapshot.sci * 100).toFixed(1)}%` : "--"),
            desc: "Societal complexity",
            color: "text-purple-400",
        },
        {
            label: "Knowledge",
            value: snapshot?.metrics?.knowledge != null ? `${(snapshot.metrics.knowledge * 100).toFixed(1)}%` : (snapshot?.state_vector?.knowledge != null ? `${(snapshot.state_vector.knowledge * 100).toFixed(1)}%` : "--"),
            desc: "Tech. advancement",
            color: "text-emerald-400",
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
