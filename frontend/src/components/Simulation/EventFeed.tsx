"use client";

import React, { useState, useEffect } from "react";
import { useSimulation } from "@/context/SimulationContext";

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }) {
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return options?.addSuffix ? "vừa xong" : "vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return options?.addSuffix ? `${minutes} phút trước` : `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return options?.addSuffix ? `${hours} giờ trước` : `${hours} giờ`;
    const days = Math.floor(hours / 24);
    return options?.addSuffix ? `${days} ngày trước` : `${days} ngày`;
}

export type Anomaly = {
    id: string;
    title: string;
    description: string;
    severity: "CRITICAL" | "WARN" | "INFO";
    tick: number;
};

export function EventFeed({ universeId: _unusedId }: { universeId: number | null }) {
    const { anomalies, liveEvents } = useSimulation();

    return (
        <div className="h-full px-4 py-2 flex flex-col gap-6 overflow-y-auto">
            {/* Live Event Stream (Kafka) */}
            <div>
                <h3 className="text-xs font-black uppercase text-cyan-400 mb-3 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Live Event Stream
                </h3>
                <div className="space-y-3">
                    {liveEvents.map((evt) => (
                        <div key={evt.id} className="flex flex-col gap-1 p-2 rounded bg-cyan-950/20 border border-cyan-900/40">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-cyan-300">{evt.type}</span>
                                <span className="text-[9px] font-mono text-cyan-500/70">Tick #{evt.tick}</span>
                            </div>
                            {evt.payload && Object.keys(evt.payload).length > 0 && (
                                <pre className="text-[8px] text-cyan-400/60 break-words whitespace-pre-wrap font-mono mt-1">
                                    {JSON.stringify(evt.payload, null, 2)}
                                </pre>
                            )}
                            <div className="text-[8px] text-muted-foreground text-right mt-1">
                                {formatDistanceToNow(new Date(evt.created_at), { addSuffix: true })}
                            </div>
                        </div>
                    ))}
                    {liveEvents.length === 0 && (
                        <div className="text-center py-4 text-[10px] text-cyan-500/40 italic">
                            Waiting for signals from Event Stream...
                        </div>
                    )}
                </div>
            </div>

            {/* Anomalies */}
            <div>
                <h3 className="text-xs font-black uppercase text-muted-foreground mb-3 tracking-[0.2em]">Spacetime Anomalies</h3>
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
                        <div className="text-center py-4 text-[10px] text-muted-foreground italic">
                           No anomalies detected in local spacetime.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
