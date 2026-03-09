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

// Simulation monitor dashboard — World State (§5), Autonomic (§13), Scheduler (§14)
export interface WorldStateSnapshot {
    tick: number;
    year?: number;
    snapshot_interval?: number;
    entropy: number;
    stability_index: number;
    planet?: Record<string, unknown>;
    civilizations?: unknown[];
    population?: Record<string, unknown>;
    economy?: Record<string, unknown>;
    knowledge?: Record<string, unknown>;
    culture?: Record<string, unknown>;
    active_attractors?: string[];
    wars?: unknown[];
    alliances?: unknown[];
    metrics?: Record<string, unknown>;
}

/**
 * Dashboard vectors aligned with WorldOS Architecture (docs/WorldOS_Architecture.md):
 * - §5 World State: snapshot.state_vector (zones, civilization, …), snapshot.metrics
 * - §13 Autonomic: GET universes/{id}/decision-metrics → UniverseDecisionMetrics (novelty, complexity, divergence, action)
 * - Lab macro state: GET lab/dashboard/state?universe_id= → tech, stability, coercion, entropy, sci, winner, tick
 * - Ideology: GET universes/{id}/ideology → dominant (tradition, innovation, trust, violence, respect, myth)
 */
export type AutonomicDecision = "continue" | "fork" | "archive" | "merge" | "mutate" | "promote";

// Decision/Navigator metrics from DecisionEngine (Autonomic §13) — for dashboard
export interface UniverseDecisionMetrics {
  action: AutonomicDecision;
  navigator_score: number;
  novelty: number | null;
  complexity: number | null;
  divergence: number | null;
  nearest_archetype: string | null;
  is_novel_archetype: boolean | null;
}

export interface UniverseSimulationItem {
    id: number;
    name: string;
    status: string;
    current_tick: number;
    current_year?: number;
    entropy?: number;
    priority?: number | null;
    order_index?: number | null;
    idle_ticks?: number;
    timeline_score?: number | null;
    autonomic_decision?: AutonomicDecision;
    fork_count_if_fork?: number | null;
    latest_snapshot?: WorldStateSnapshot | null;
}

export interface WorldSimulationStatusResponse {
    world: {
        id: number;
        name: string;
        is_autonomic: boolean;
        global_tick: number;
        snapshot_interval?: number;
    };
    pipeline?: { phase: string; steps: string[] };
    scheduler?: {
        tick_budget: number;
        priority_weights: Record<string, number>;
        aging_factor?: number;
    };
    autonomic?: {
        fork_entropy_min: number;
        archive_entropy_threshold: number;
    };
    universes: UniverseSimulationItem[];
    counts?: { active: number; halted: number; restarting: number };
    tick_pipeline_engines?: Array<{ priority: number; name: string }>;
}
