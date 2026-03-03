"use client";

import React, { useState, useEffect } from "react";

export type Anomaly = {
    id: string;
    title: string;
    description: string;
    severity: "CRITICAL" | "WARN" | "INFO";
    tick: number;
};

import { useWorldStream } from "@/hooks/useWorldStream";

export function EventFeed({ universeId }: { universeId: number | null }) {
    const { anomalies } = useWorldStream(universeId);

    return (
        <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur h-full">
            <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="font-semibold leading-none tracking-tight text-blue-400">Recent Anomalies</h3>
                <p className="text-sm text-muted-foreground">Detected system irregularities.</p>
            </div>
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="flex items-start">
                        <span className="relative flex h-2 w-2 mt-1.5 mr-4 flex-shrink-0">
                            {anomaly.severity === 'CRITICAL' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${anomaly.severity === 'CRITICAL' ? 'bg-red-500' :
                                anomaly.severity === 'WARN' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></span>
                        </span>
                        <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium leading-none text-slate-200">{anomaly.title}</p>
                            <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                        </div>
                        <div className={`ml-auto text-[10px] font-bold ${anomaly.severity === 'CRITICAL' ? 'text-red-500' :
                            anomaly.severity === 'WARN' ? 'text-orange-500' : 'text-blue-500'
                            }`}>
                            {anomaly.severity}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
