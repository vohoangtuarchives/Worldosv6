"use client";

import React from "react";
import { type Snapshot } from "@/types/simulation";

interface MetricGridProps {
    snapshot: Snapshot | null;
}

export function MetricGrid({ snapshot }: MetricGridProps) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
                <div key={card.label} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 backdrop-blur">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">{card.label}</h3>
                    </div>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                </div>
            ))}
        </div>
    );
}
