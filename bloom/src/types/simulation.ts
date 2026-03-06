export interface Universe {
    id: number;
    world_id: number;
    name?: string;
    status: string;
    current_tick: number;
    world?: World;
    state_vector?: Record<string, unknown>;
    kernel_genome?: Record<string, unknown>;
    fitness_score?: number;
    observation_load?: number;
    supreme_entities?: SupremeEntity[];
}

export interface World {
    id: number;
    name: string;
    slug: string;
    multiverse_id: number;
    origin?: string;
    axiom?: Record<string, unknown>;
    current_genre?: string;
    is_autonomic?: boolean;
    relics?: unknown[];
}

export interface Snapshot {
    id: number;
    universe_id: number;
    tick: number;
    state_vector: Record<string, unknown>;
    entropy: number;
    stability_index: number;
    metrics: Record<string, unknown>;
}

export interface Anomaly {
    id: number;
    universe_id: number;
    type: string;
    intensity: number;
    description: string;
    manifested_at_tick: number;
    severity?: string;
    title?: string;
}

export interface Institution {
    id: number;
    name: string;
    type: string;
    entity_type?: string;
    power_score: number;
    ideology: string;
    influence_map?: unknown[];
    spawned_at_tick?: number;
    org_capacity?: number;
    legitimacy?: number;
    ideology_vector?: Record<string, number>;
}

export interface Actor {
    id: number;
    name: string;
    archetype: string;
    status: string;
    willpower: number;
    traits?: Record<string, number>;
    biography?: string;
    is_alive?: boolean;
    metrics?: { influence?: number; [k: string]: unknown };
}

export interface Chronicle {
    id: number;
    event_type: string;
    description: string;
    tick: number;
    content?: string;
    from_tick?: number;
    to_tick?: number;
    type?: string;
    created_at?: string;
    perceived_archive_snapshot?: { noise_level?: number; clarity?: string; [k: string]: unknown };
}

export interface SupremeEntity {
    id: number;
    name: string;
    entity_type: string;
    domain: string;
    description: string;
    power_level: number;
    alignment: Record<string, number>;
    status: string;
    ascended_at_tick: number;
    karma?: number;
}

export interface Interaction {
    id: number;
    actor_a_id: number;
    actor_b_id: number;
    type: string;
    strength: number;
    interaction_type?: string;
    created_at?: string;
    universe_a_id?: number;
    universe_b_id?: number;
    universe_b?: { name?: string; [k: string]: unknown };
    payload?: { tick?: number; [k: string]: unknown };
    resonance_level?: number;
}

export interface Trajectory {
    id: number;
    universe_id: number;
    path_data: Record<string, unknown>;
    target_tick?: number;
    probability?: number;
    phenomenon_description?: string;
    convergence_type?: string;
}
