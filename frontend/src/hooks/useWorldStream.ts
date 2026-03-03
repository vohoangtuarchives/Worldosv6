"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export type Snapshot = {
    tick: number;
    entropy: number;
    stability_index: number;
    metrics?: Record<string, any>;
    state_vector?: Record<string, any>;
};

export type Anomaly = {
    id: string;
    title: string;
    description: string;
    severity: "CRITICAL" | "WARN" | "INFO";
    tick: number;
};

export type Universe = {
    id: number;
    world_id: number;
    current_tick?: number;
    status?: string;
    observation_load?: number;
    supreme_entities?: any[];
    state_vector?: Record<string, any>;
    world?: {
        id: number;
        name: string;
        axiom?: Record<string, any>;
        is_autonomic?: boolean;
        current_genre?: string;
        origin?: string;
    };
};

export function useWorldStream(universeId: number | null) {
    const [universe, setUniverse] = useState<Universe | null>(null);
    const [latestSnapshot, setLatestSnapshot] = useState<Snapshot | null>(null);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUniverse = useCallback(async () => {
        if (!universeId) return;
        try {
            const u = await api.universe(universeId);
            setUniverse(u);
        } catch (e) {
            console.error("Failed to fetch universe", e);
        }
    }, [universeId]);

    const refresh = useCallback(async () => {
        if (!universeId) return;
        try {
            const [snaps, anoms] = await Promise.all([
                api.snapshots(universeId, 1),
                api.anomalies(universeId)
            ]);

            if (snaps && snaps.length > 0) {
                setLatestSnapshot(snaps[0]);
            }
            if (anoms) {
                setAnomalies(anoms);
            }
        } catch (e) {
            console.error("Failed to refresh world state", e);
        }
    }, [universeId]);

    useEffect(() => {
        fetchUniverse();
    }, [fetchUniverse]);

    useEffect(() => {
        if (!universeId) return;

        let active = true;
        let timerId: any;

        const poll = async () => {
            await refresh();
            if (active) {
                timerId = setTimeout(poll, 2000); // Poll every 2s
            }
        };

        poll();

        return () => {
            active = false;
            clearTimeout(timerId);
        };
    }, [universeId, refresh]);

    return {
        universe,
        latestSnapshot,
        anomalies,
        loading,
        error,
        refresh,
        setUniverse,
    };
}
