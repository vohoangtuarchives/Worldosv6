export type Snapshot = {
    id?: number;
    tick: number;
    entropy: number;
    stability_index: number;
    sci?: number;
    metrics?: Record<string, any>;
    state_vector?: Record<string, any>;
};

export type Chronicle = {
    id: number;
    tick: number;
    event_type?: string;
    type?: string;
    description: string;
    content?: string;
    from_tick?: number;
    to_tick?: number;
    created_at?: string;
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
    name?: string;
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
