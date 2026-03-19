"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  useUniverses, 
  useUniverse, 
  useLatestSnapshot, 
  useActors, 
  useInstitutions, 
  useAnomalies, 
  useSupremeEntities, 
  useMaterials, 
  useChronicles,
  useInteractions,
  useTrajectories,
  simulationKeys
} from '@/hooks/useSimulationQueries';

interface SimulationContextType {
    universeId: number | null;
    universe: any | null;
    latestSnapshot: any | null;
    anomalies: any[];
    institutions: any[];
    actors: any[];
    chronicles: any[];
    supremeEntities: any[];
    materials: any[];
    interactions: any[];
    trajectories: any[];
    universes: any[];
    liveEvents: any[];
    loading: boolean;
    error: string | null;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    refresh: () => Promise<void>;
    setUniverseId: (id: number | null) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [universeId, setUniverseIdState] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);

    // Sync from localStorage
    useEffect(() => {
        const stored = window.localStorage.getItem("universe_id");
        if (stored) setUniverseIdState(Number(stored));

        const handleStorage = () => {
            const current = window.localStorage.getItem("universe_id");
            setUniverseIdState(current ? Number(current) : null);
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const setUniverseId = (id: number | null) => {
        setUniverseIdState(id);
        if (id) window.localStorage.setItem("universe_id", id.toString());
        else window.localStorage.removeItem("universe_id");
    };

    // React Query Hooks
    const { data: universes = [], isLoading: loadingUniverses } = useUniverses();
    const { data: universe = null, isLoading: loadingUniverse, error: universeError } = useUniverse(universeId);
    const { data: latestSnapshot = null, isLoading: loadingSnapshot } = useLatestSnapshot(universeId);
    
    // Auxiliary Data (Only fetch if needed by components, but SimulationContext provides them for legacy support)
    const { data: actors = [] } = useActors(universeId);
    const { data: institutions = [] } = useInstitutions(universeId);
    const { data: anomalies = [] } = useAnomalies(universeId);
    const { data: supremeEntities = [] } = useSupremeEntities(universeId);
    const { data: materials = [] } = useMaterials(universeId);
    const { data: chronicles = [] } = useChronicles(universeId);
    const { data: interactions = [] } = useInteractions(universeId);
    const { data: trajectories = [] } = useTrajectories(universeId);

    const loading = loadingUniverses || loadingUniverse || loadingSnapshot;
    const error = localError || (universeError as any)?.message || null;

    // Realtime: SSE snapshot stream
    useEffect(() => {
        if (!universeId || isPaused || typeof window === "undefined") return;

        let es: EventSource | null = null;
        let retryCount = 0;
        const maxRetries = 5;

        const connect = () => {
            if (es) es.close();
            const url = api.universeSnapshotStreamUrl(universeId);
            es = new EventSource(url);

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const newSnapshot = {
                        tick: data.tick,
                        entropy: data.entropy,
                        stability_index: data.stability_index,
                        metrics: data.metrics ?? {},
                    };
                    // Update React Query Cache directly
                    queryClient.setQueryData(simulationKeys.latestSnapshot(universeId), newSnapshot);
                    
                    retryCount = 0;
                    setLocalError(null);
                } catch (_) {}
            };

            es.onerror = () => {
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(connect, Math.min(1000 * Math.pow(2, retryCount), 10000));
                } else {
                    setLocalError("Mất kết nối realtime.");
                    if (es) es.close();
                }
            };
        };

        connect();
        return () => { if (es) es.close(); };
    }, [universeId, isPaused, queryClient]);

    // Centrifugo Live Events
    useEffect(() => {
        if (!universeId || isPaused || typeof window === "undefined") return;

        import("centrifuge").then(({ Centrifuge }) => {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const centrifuge = new Centrifuge(`${protocol}//${window.location.host}/connection/websocket`);
            const sub = centrifuge.newSubscription("public:universes");

            sub.on("publication", (ctx) => {
                const data = ctx.data as any;
                if (data && data.universeId && String(data.universeId) === String(universeId)) {
                    setLiveEvents((prev) => {
                        const newEvent = {
                            id: data.occurredAt + "-" + Math.random(),
                            tick: data.tick,
                            type: data.type,
                            payload: data.payload,
                            created_at: data.occurredAt
                        };
                        return [newEvent, ...prev].slice(0, 50);
                    });
                    
                    // Trigger refetch of auxiliary data when important events occur
                    if (data.type === 'snapshot_update' || data.type === 'pulse') {
                        queryClient.invalidateQueries({ queryKey: simulationKeys.all });
                    }
                }
            });

            sub.subscribe();
            centrifuge.connect();
            return () => { centrifuge.disconnect(); };
        });
    }, [universeId, isPaused, queryClient]);

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: simulationKeys.all });
    };

    const value = useMemo(() => ({
        universeId,
        universe,
        latestSnapshot,
        anomalies,
        institutions,
        actors,
        chronicles,
        supremeEntities,
        materials,
        interactions,
        trajectories,
        universes,
        liveEvents,
        loading,
        error,
        isPaused,
        setIsPaused,
        refresh,
        setUniverseId,
    }), [
        universeId, universe, latestSnapshot, anomalies, institutions,
        actors, chronicles, supremeEntities, materials, interactions, trajectories,
        universes, liveEvents, loading, error, isPaused
    ]);

    return (
        <SimulationContext.Provider value={value}>
            {children}
        </SimulationContext.Provider>
    );
}

export function useSimulation() {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
}
