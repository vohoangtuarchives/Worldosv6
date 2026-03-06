"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Agent {
    provider: string;
    model: string;
    role: string;
}

interface Provider {
    status: "online" | "missing_key" | "offline";
    url?: string;
}

interface LoomStatus {
    status: "online" | "offline" | "degraded" | "error";
    agents: Record<string, Agent>;
    providers: Record<string, Provider>;
    message?: string;
    version?: string;
}

export default function LoomStatusPanel() {
    const [data, setData] = useState<LoomStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.ipFactory.loomStatus();
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 30000);
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return <div className="h-8 w-full bg-muted animate-pulse rounded-[var(--radius)]" />;
    }

    if (!data || data.status === "offline") {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] border border-destructive/20 bg-destructive/5 text-[10px] text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                Narrative Loom Offline
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-[var(--radius)] border border-border bg-card/30">
                <div className="flex items-center gap-2 text-[10px]">
                    <span className={`h-1.5 w-1.5 rounded-full ${data.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold uppercase tracking-wider opacity-70">Loom Pipeline</span>
                    <span className="opacity-40">v{data.version}</span>
                </div>
                <div className="flex gap-1.5">
                    {Object.entries(data.providers).map(([name, p]) => (
                        <div
                            key={name}
                            title={`${name}: ${p.status}`}
                            className={`h-1.5 w-3 rounded-full transition-colors ${p.status === 'online' ? 'bg-emerald-500/40' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {Object.entries(data.agents).map(([id, agent]) => {
                    const isLocal = agent.provider === 'local';
                    return (
                        <div key={id} className="p-2 rounded-[var(--radius)] border border-border bg-card/20 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase text-muted-foreground">{id}</span>
                                <span className={`px-1 rounded-[2px] text-[8px] font-bold ${isLocal ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                                    }`}>
                                    {isLocal ? 'LOCAL' : 'CLOUD'}
                                </span>
                            </div>
                            <div className="text-[10px] truncate font-medium opacity-90">{agent.model}</div>
                            <div className="text-[8px] text-muted-foreground italic truncate">{agent.role}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
