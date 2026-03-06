import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Universe, World, Snapshot, Anomaly, Institution, Actor, Chronicle, SupremeEntity, Interaction, Trajectory } from '@/types/simulation';

interface SimulationContextType {
    universeId: number | null;
    universe: Universe | null;
    latestSnapshot: Snapshot | null;
    anomalies: Anomaly[];
    institutions: Institution[];
    actors: Actor[];
    chronicles: Chronicle[];
    supremeEntities: SupremeEntity[];
    interactions: Interaction[];
    trajectories: Trajectory[];
    universes: Universe[];
    loading: boolean;
    error: string | null;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    refresh: () => Promise<void>;
    setUniverseId: (id: number | null) => void;
    setUniverse: React.Dispatch<React.SetStateAction<Universe | null>>;
    setLatestSnapshot: React.Dispatch<React.SetStateAction<Snapshot | null>>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
    const [universeId, setUniverseId] = useState<number | null>(null);
    const [universe, setUniverse] = useState<Universe | null>(null);
    const [latestSnapshot, setLatestSnapshot] = useState<Snapshot | null>(null);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [actors, setActors] = useState<Actor[]>([]);
    const [chronicles, setChronicles] = useState<Chronicle[]>([]);
    const [supremeEntities, setSupremeEntities] = useState<SupremeEntity[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
    const [universes, setUniverses] = useState<Universe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    const isFetching = useRef(false);

    // Sync from localStorage
    useEffect(() => {
        const stored = window.localStorage.getItem("universe_id");
        if (stored) setUniverseId(Number(stored));

        const handleStorage = () => {
            const current = window.localStorage.getItem("universe_id");
            setUniverseId(current ? Number(current) : null);
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const fetchVitalData = useCallback(async (id: number) => {
        const [uRes, snapRes, anomRes] = await Promise.all([
            api.universe(id),
            api.snapshots(id, 1),
            api.anomalies(id)
        ]);

        const u = uRes.data || uRes;
        setUniverse(u);

        const snaps = snapRes.data || snapRes || [];
        if (Array.isArray(snaps) && snaps.length > 0) {
            setLatestSnapshot(snaps[0]);
        }

        const anoms = anomRes.data || anomRes || [];
        setAnomalies(Array.isArray(anoms) ? anoms : []);
    }, []);

    const fetchAuxiliaryData = useCallback(async (id: number) => {
        const [instRes, actorRes, chronRes, supremeRes, interRes, trajRes] = await Promise.all([
            api.institutions(id),
            api.actors(id),
            api.chronicle(id),
            api.supremeEntities(id),
            api.interactions(id),
            api.trajectories(id)
        ]);

        setInstitutions(instRes.data || instRes || []);
        setActors(actorRes.data || actorRes || []);
        setChronicles(chronRes.data || chronRes || []);
        setSupremeEntities(supremeRes.data || supremeRes || []);
        setInteractions(interRes.data || interRes || []);
        setTrajectories(trajRes.data || trajRes || []);
    }, []);

    const refresh = useCallback(async (forceAux = false) => {
        if (!universeId || isFetching.current) return;

        isFetching.current = true;
        setLoading(true);

        try {
            await fetchVitalData(universeId);
            if (forceAux) {
                await fetchAuxiliaryData(universeId);
            }
            setError(null);
        } catch (e: unknown) {
            console.error("Simulation refresh failed", e);
            const err = e as { message?: string; status?: number };
            if (err.message?.includes("404") || err.status === 404) {
                setError(`Vũ trụ #${universeId} không tồn tại hoặc đã bị xóa.`);
                setUniverseId(null);
                if (typeof window !== "undefined") {
                    window.localStorage.removeItem("universe_id");
                }
            } else {
                setError(`Lỗi đồng bộ: ${err.message || "Không xác định"}`);
            }
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [universeId, fetchVitalData, fetchAuxiliaryData]);

    // Polling Logic
    useEffect(() => {
        if (!universeId || isPaused) return;

        // Vital Polling (Inner Pulse) - Every 5s
        const vitalInterval = setInterval(() => {
            refresh(false);
        }, 5000);

        // Auxiliary Polling (Outer Pulse) - Every 20s
        const auxiliaryInterval = setInterval(() => {
            refresh(true);
        }, 20000);

        // Immediate first fetch
        refresh(true);

        return () => {
            clearInterval(vitalInterval);
            clearInterval(auxiliaryInterval);
        };
    }, [universeId, isPaused, refresh]);

    // Initial fetch of universes list
    useEffect(() => {
        const fetchUniverses = async () => {
            try {
                const res = await api.universes({});
                setUniverses(res.data || res || []);
            } catch (e) {
                console.error("Failed to fetch universes list", e);
            }
        };
        fetchUniverses();
        const interval = setInterval(fetchUniverses, 60000); // Very infrequent
        return () => clearInterval(interval);
    }, []);

    const value = React.useMemo(() => ({
        universeId,
        universe,
        latestSnapshot,
        anomalies,
        institutions,
        actors,
        chronicles,
        supremeEntities,
        interactions,
        trajectories,
        universes,
        loading,
        error,
        isPaused,
        setIsPaused,
        refresh: () => refresh(true),
        setUniverseId,
        setUniverse,
        setLatestSnapshot
    }), [
        universeId, universe, latestSnapshot, anomalies, institutions,
        actors, chronicles, supremeEntities, interactions, trajectories,
        universes, loading, error, isPaused, refresh
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
