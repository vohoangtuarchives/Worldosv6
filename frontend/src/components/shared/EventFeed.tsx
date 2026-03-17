"use client";

import React, { useState, useEffect } from "react";

export type Anomaly = {
    id: string;
    title: string;
    description: string;
    severity: "CRITICAL" | "WARN" | "INFO";
    tick: number;
};

import { useSimulation } from "@/context/SimulationContext";

export function EventFeed({ universeId: _unusedId }: { universeId: number | null }) {
    const { anomalies } = useSimulation();

    return (
        <div className="h-full px-4 py-2">
            <div className="space-y-4">
                {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="flex items-start group relative pl-4 border-l border-border hover:border-muted-foreground/50 transition-colors py-1">
                        <span className={`absolute -left-[3px] top-2 h-1.5 w-1.5 rounded-full ring-2 ring-background ${
                            anomaly.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                            anomaly.severity === 'WARN' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        
                        <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-start">
                                <p className={`text-xs font-semibold leading-none ${
                                    anomaly.severity === 'CRITICAL' ? 'text-red-400' :
                                    anomaly.severity === 'WARN' ? 'text-amber-400' : 'text-blue-400'
                                }`}>
                                    {anomaly.title}
                                </p>
                                <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{anomaly.severity}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-snug group-hover:text-foreground/80 transition-colors">{anomaly.description}</p>
                        </div>
                    </div>
                ))}
                {anomalies.length === 0 && (
                   <div className="text-center py-8 text-xs text-muted-foreground italic">
                       No anomalies detected in local spacetime.
                   </div>
                )}
            </div>
        </div>
    );
}
