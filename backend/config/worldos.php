<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Simulation Engine (Rust gRPC)
    |--------------------------------------------------------------------------
    */
    'simulation_engine_grpc_url' => env('SIMULATION_ENGINE_GRPC_URL', 'localhost:50051'),

    /*
    |--------------------------------------------------------------------------
    | Simulation Tick Driver (Phase 5)
    |--------------------------------------------------------------------------
    | laravel_kernel: tick from Rust, then optionally run Laravel SimulationKernel
    |                 (see simulation_kernel_post_tick) and overwrite snapshot.
    | rust_only:     tick entirely from Rust; Laravel only syncs state, saves
    |                 snapshot, fires events, runs listeners (AEE, fork, narrative).
    */
    'simulation_tick_driver' => env('WORLDOS_SIMULATION_TICK_DRIVER', 'rust_only'),

    /*
    |--------------------------------------------------------------------------
    | Simulation Kernel (Laravel-side post-tick)
    |--------------------------------------------------------------------------
    | When true and simulation_tick_driver is laravel_kernel, after Rust engine
    | saves snapshot, run SimulationKernel and overwrite snapshot.
    */
    'simulation_kernel_post_tick' => env('SIMULATION_KERNEL_POST_TICK', false),

    /*
    |--------------------------------------------------------------------------
    | Event Bus Backend (Phase 5 Track A)
    |--------------------------------------------------------------------------
    | database: persist to world_events table, dispatch Laravel event.
    | redis_stream: XADD to Redis Stream (world_events) then persist + dispatch.
    */
    'event_bus' => [
        'driver' => env('WORLDOS_EVENT_BUS_DRIVER', 'database'),
        'stream_key' => env('WORLDOS_EVENT_BUS_STREAM_KEY', 'world_events'),
    ],

    /*
    |--------------------------------------------------------------------------
    | WorldOS Data Graph (Phase 5 Track B, doc §15)
    |--------------------------------------------------------------------------
    | When enabled and uri is set, sync WorldEvent to Neo4j (Event node, INVOLVES Actor).
    */
    'graph' => [
        'enabled' => env('WORLDOS_GRAPH_ENABLED', false),
        'uri' => env('WORLDOS_GRAPH_URI', 'http://localhost:7474'),
        'username' => env('WORLDOS_GRAPH_USERNAME'),
        'password' => env('WORLDOS_GRAPH_PASSWORD'),
    ],

    'potential_field_war_threshold' => (float) env('WORLDOS_POTENTIAL_FIELD_WAR_THRESHOLD', 0.85),

    /*
    |--------------------------------------------------------------------------
    | Time-Scale Engine (tick factors) — Simulation Kernel (Tier 3)
    |--------------------------------------------------------------------------
    | Tick rate per kernel engine: engine runs when tick % factor === 0.
    | physics=1 (every tick), ecology=10, evolution=100, climate=500, etc.
    | Each SimulationEngine implements tickRate() reading from this config.
    */
    'time_scale_factors' => [
        'potential_field' => (int) env('WORLDOS_TIME_SCALE_POTENTIAL_FIELD', 1),
        'zone_conflict' => (int) env('WORLDOS_TIME_SCALE_ZONE_CONFLICT', 1),
        'cosmic_pressure' => (int) env('WORLDOS_TIME_SCALE_COSMIC_PRESSURE', 1),
        'structural_decay' => (int) env('WORLDOS_TIME_SCALE_STRUCTURAL_DECAY', 5),
        'law_evolution' => (int) env('WORLDOS_TIME_SCALE_LAW_EVOLUTION', 20),
        'cultural_drift' => (int) env('WORLDOS_TIME_SCALE_CULTURAL_DRIFT', 3),
        'adaptive_topology' => (int) env('WORLDOS_TIME_SCALE_ADAPTIVE_TOPOLOGY', 50),
    ],

    /*
    |--------------------------------------------------------------------------
    | Planetary Climate Engine (Tier 4)
    |--------------------------------------------------------------------------
    | Solar input, latitude zones, temperature/rainfall per zone, seasonal cycle.
    | Output feeds Phase Transition and biome. Runs slowly (e.g. every 500 ticks).
    */
    'planetary_climate' => [
        'tick_interval' => (int) env('WORLDOS_PLANETARY_CLIMATE_TICK_INTERVAL', 500),
        'seasonal_cycle_ticks' => (int) env('WORLDOS_PLANETARY_CLIMATE_SEASONAL_TICKS', 1000),
        'base_temperature' => (float) env('WORLDOS_PLANETARY_CLIMATE_BASE_TEMP', 0.5),
        'latitude_temperature_amplitude' => (float) env('WORLDOS_PLANETARY_CLIMATE_LAT_TEMP', 0.25),
        'seasonal_temperature_amplitude' => (float) env('WORLDOS_PLANETARY_CLIMATE_SEASON_TEMP', 0.1),
        'equator_rainfall' => (float) env('WORLDOS_PLANETARY_CLIMATE_EQUATOR_RAIN', 0.75),
        'pole_rainfall' => (float) env('WORLDOS_PLANETARY_CLIMATE_POLE_RAIN', 0.2),
        'ice_coverage_temp_threshold' => (float) env('WORLDOS_PLANETARY_CLIMATE_ICE_TEMP', 0.25),
    ],

    /*
    |--------------------------------------------------------------------------
    | Geological Engine (Tier 5)
    |--------------------------------------------------------------------------
    | Elevation, terrain type, mineral distribution per zone. Very slow (geology_tick 5000+).
    | Terrain feeds Climate (elevation) and future Civilization. Deterministic: seed + tick.
    */
    'geological' => [
        'tick_interval' => (int) env('WORLDOS_GEOLOGICAL_TICK_INTERVAL', 5000),
        'elevation_drift_rate' => (float) env('WORLDOS_GEOLOGICAL_ELEVATION_DRIFT', 0.002),
        'volcano_probability_per_zone' => (float) env('WORLDOS_GEOLOGICAL_VOLCANO_PROB', 0.02),
        'erosion_rate' => (float) env('WORLDOS_GEOLOGICAL_EROSION_RATE', 0.001),
    ],

    /*
    |--------------------------------------------------------------------------
    | Eschaton: material survivability (per ontology)
    |--------------------------------------------------------------------------
    | Chance (0..1) that a material instance survives Eschaton. Symbolic/mythic ideas survive more.
    */
    'eschaton_survivability' => [
        'symbolic' => (float) env('WORLDOS_ESCHATON_SURVIVABILITY_SYMBOLIC', 0.25),
        'institutional' => (float) env('WORLDOS_ESCHATON_SURVIVABILITY_INSTITUTIONAL', 0.15),
        'behavioral' => (float) env('WORLDOS_ESCHATON_SURVIVABILITY_BEHAVIORAL', 0.1),
        'physical' => (float) env('WORLDOS_ESCHATON_SURVIVABILITY_PHYSICAL', 0.05),
        'default' => (float) env('WORLDOS_ESCHATON_SURVIVABILITY_DEFAULT', 0.1),
    ],

    'narrative_llm_url' => env('NARRATIVE_LLM_URL', ''),

    /*
    |--------------------------------------------------------------------------
    | Narrative LLM (OpenAI or compatible)
    |--------------------------------------------------------------------------
    | API key and model for chronicle generation. Falls back to services.openai.
    */
    'narrative' => [
        'openai_api_key' => env('OPENAI_API_KEY', env('NARRATIVE_LLM_OPENAI_API_KEY', '')),
        'model' => env('NARRATIVE_LLM_MODEL', env('OPENAI_MODEL', 'gpt-4o')),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com'),
        'timeout' => (int) env('NARRATIVE_LLM_TIMEOUT', 30),
    ],

    'memory' => [
        'driver' => env('WORLDOS_MEMORY_DRIVER', 'db_json'),
        'max_candidates' => (int) env('WORLDOS_MEMORY_MAX_CANDIDATES', 500),
        'embedding_model' => env('WORLDOS_MEMORY_EMBEDDING_MODEL', 'hashing-384'),
        'embedding_version' => env('WORLDOS_MEMORY_EMBEDDING_VERSION', 'v1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Intelligence: Dramatis Personae (actors)
    |--------------------------------------------------------------------------
    | actor_minimum_population: Số actor sống tối thiểu mỗi universe. Mỗi pulse
    | nếu số alive < số này sẽ spawn thêm cho đủ. Đặt 0 = không tự spawn (không giới hạn).
    | Gợi ý: 0 (tắt), 3–5 (ít, narrative tập trung), 8–12 (nhiều, xã hội đông).
    | ticks_per_year: Số tick mô phỏng tương đương 1 năm trong world. VD: 1 = mỗi tick là 1 năm, 12 = mỗi tick ~1 tháng.
    | default_max_age_years: Tuổi thọ tối đa (năm) mặc định cho actor dạng "human". Actor chết khi age_years >= effective_max (effective_max phụ thuộc trait Longevity).
    | mortality_curve: age_ratio = age / life_expectancy; death_prob per tick theo từng khoảng (trẻ ít chết, già chết nhiều).
    */
    'intelligence' => [
        'actor_minimum_population' => (int) env('WORLDOS_ACTOR_MINIMUM_POPULATION', 5),
        'ticks_per_year' => (int) env('WORLDOS_TICKS_PER_YEAR', 1),
        'default_max_age_years' => (int) env('WORLDOS_DEFAULT_MAX_AGE_YEARS', 150),
        // Mortality curve: [age_ratio_max => death_prob_per_tick]. age_ratio = age / life_expectancy. String keys to avoid float→int deprecation.
        'mortality_curve' => [
            '0.6' => (float) env('WORLDOS_MORTALITY_DEATH_PROB_YOUNG', 0.001),
            '1.0' => (float) env('WORLDOS_MORTALITY_DEATH_PROB_MID', 0.01),
            'old' => (float) env('WORLDOS_MORTALITY_DEATH_PROB_OLD', 0.2), // age_ratio >= 1.0
        ],
        // Energy economy (Phase 2)
        'metabolism_base' => (float) env('WORLDOS_METABOLISM_BASE', 0.5),
        'energy_max_default' => (float) env('WORLDOS_ENERGY_MAX_DEFAULT', 200),
        'starvation_threshold' => (float) env('WORLDOS_STARVATION_THRESHOLD', 20),
        'gather_rate' => (float) env('WORLDOS_GATHER_RATE', 5),
        'resource_regen_rate' => (float) env('WORLDOS_RESOURCE_REGEN_RATE', 2),
        // Reproduction (Phase 2b)
        'reproduce_cost' => (float) env('WORLDOS_REPRODUCE_COST', 80),
        'reproduce_energy_ratio_child' => (float) env('WORLDOS_REPRODUCE_ENERGY_RATIO_CHILD', 0.3),
        'mutation_rate' => (float) env('WORLDOS_MUTATION_RATE', 0.05),
        // Ecological Collapse Engine (Tier 1)
        'ecological_collapse_tick_interval' => (int) env('WORLDOS_ECOLOGICAL_COLLAPSE_TICK_INTERVAL', 50),
        'ecological_collapse_instability_threshold' => (float) env('WORLDOS_ECOLOGICAL_COLLAPSE_INSTABILITY_THRESHOLD', 0.7),
        'ecological_collapse_duration_min' => (int) env('WORLDOS_ECOLOGICAL_COLLAPSE_DURATION_MIN', 200),
        'ecological_collapse_duration_max' => (int) env('WORLDOS_ECOLOGICAL_COLLAPSE_DURATION_MAX', 1000),
        'ecological_collapse_recovery_ticks' => (int) env('WORLDOS_ECOLOGICAL_COLLAPSE_RECOVERY_TICKS', 100),
        'ecological_collapse_resource_regeneration_factor' => (float) env('WORLDOS_ECOLOGICAL_COLLAPSE_RESOURCE_REGEN_FACTOR', 0.5),
        'ecological_collapse_death_probability_add' => (float) env('WORLDOS_ECOLOGICAL_COLLAPSE_DEATH_PROB_ADD', 0.1),
        'ecological_collapse_reproduction_factor' => (float) env('WORLDOS_ECOLOGICAL_COLLAPSE_REPRODUCTION_FACTOR', 0.4),
        // Ecological Phase Transition Engine (Tier 2): biome shift (forest / grassland / desert)
        'ecological_phase_transition_tick_interval' => (int) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_TICK_INTERVAL', 100),
        'ecological_phase_transition_duration_ticks' => (int) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_DURATION_TICKS', 50),
        'ecological_phase_transition_rainfall_desert_max' => (float) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_RAINFALL_DESERT_MAX', 0.35),
        'ecological_phase_transition_rainfall_forest_min' => (float) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_RAINFALL_FOREST_MIN', 0.65),
        'ecological_phase_transition_biome_resource_regen' => [
            'forest' => (float) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_BIOME_REGEN_FOREST', 1.2),
            'grassland' => (float) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_BIOME_REGEN_GRASSLAND', 1.0),
            'desert' => (float) env('WORLDOS_ECOLOGICAL_PHASE_TRANSITION_BIOME_REGEN_DESERT', 0.6),
        ],
        // Behavior & Decision Engine (Tier 6): needs, goal, Utility AI, execution state
        'behavior_tick_interval' => (int) env('WORLDOS_BEHAVIOR_TICK_INTERVAL', 1),
        'behavior_stagger_modulus' => (int) env('WORLDOS_BEHAVIOR_STAGGER_MODULUS', 3),
        'behavior_memory_decay_rate' => (float) env('WORLDOS_BEHAVIOR_MEMORY_DECAY_RATE', 0.01),
        // Culture Engine (Tier 7): meme pool, transmission, selection, culture_weight in behavior
        'culture_tick_interval' => (int) env('WORLDOS_CULTURE_TICK_INTERVAL', 10),
        'culture_transmission_rate' => (float) env('WORLDOS_CULTURE_TRANSMISSION_RATE', 0.15),
        'culture_mutation_rate' => (float) env('WORLDOS_CULTURE_MUTATION_RATE', 0.05),
        'culture_weight_in_behavior' => (float) env('WORLDOS_CULTURE_WEIGHT_IN_BEHAVIOR', 0.2),
        // Language Engine (Tier 8): vocabulary, intent→encode→decode, communication, memory, language groups
        'language_tick_interval' => (int) env('WORLDOS_LANGUAGE_TICK_INTERVAL', 5),
        'language_vocabulary_max_size' => (int) env('WORLDOS_LANGUAGE_VOCABULARY_MAX_SIZE', 24),
        'language_communication_probability' => (float) env('WORLDOS_LANGUAGE_COMMUNICATION_PROB', 0.2),
        'language_memory_size' => (int) env('WORLDOS_LANGUAGE_MEMORY_SIZE', 5),
        'language_memory_decay' => (float) env('WORLDOS_LANGUAGE_MEMORY_DECAY', 0.05),
        // Civilization Engine (Tier 9): settlement layer
        'civilization_tick_interval' => (int) env('WORLDOS_CIVILIZATION_TICK_INTERVAL', 20),
        'civilization_settlement_thresholds' => ['camp' => 0, 'village' => 3, 'town' => 6, 'city' => 12],
        // Global Economy (Tier 10)
        'economy_tick_interval' => (int) env('WORLDOS_ECONOMY_TICK_INTERVAL', 20),
        // Politics (Tier 11)
        'politics_tick_interval' => (int) env('WORLDOS_POLITICS_TICK_INTERVAL', 25),
        // War (Tier 12)
        'war_tick_interval' => (int) env('WORLDOS_WAR_TICK_INTERVAL', 30),
        // History (Tier 13): timeline aggregation
        'history_timeline_limit' => (int) env('WORLDOS_HISTORY_TIMELINE_LIMIT', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Autonomic: fork / archive thresholds (self-fork universe)
    |--------------------------------------------------------------------------
    | fork_entropy_min: entropy >= this may trigger fork. archive_entropy_threshold: entropy >= this → archive.
    | stagnation_threshold: novelty below this → mutate (stub) in AEE.
    */
    'autonomic' => [
        'fork_entropy_min' => (float) env('WORLDOS_FORK_ENTROPY_MIN', 0.5),
        'archive_entropy_threshold' => (float) env('WORLDOS_ARCHIVE_ENTROPY_THRESHOLD', 0.99),
        'stagnation_threshold' => (float) env('WORLDOS_STAGNATION_THRESHOLD', 0.1),
        'max_fork_branches' => (int) env('WORLDOS_MAX_FORK_BRANCHES', 1),
    ],

    /*
    |--------------------------------------------------------------------------
    | Multiverse Scheduler: tick budget and priority (Phase B)
    |--------------------------------------------------------------------------
    | tick_budget: max universes to tick per world per cycle (0 = no limit).
    | priority_weights: novelty, complexity, civilization, entropy (sum to 1).
    */
    'scheduler' => [
        'tick_budget' => (int) env('WORLDOS_SCHEDULER_TICK_BUDGET', 0),
        'priority_weights' => [
            'novelty' => (float) env('WORLDOS_SCHEDULER_WEIGHT_NOVELTY', 0.25),
            'complexity' => (float) env('WORLDOS_SCHEDULER_WEIGHT_COMPLEXITY', 0.30),
            'civilization' => (float) env('WORLDOS_SCHEDULER_WEIGHT_CIVILIZATION', 0.25),
            'entropy' => (float) env('WORLDOS_SCHEDULER_WEIGHT_ENTROPY', 0.20),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Timeline Selection: narrative interest scoring (Phase C)
    |--------------------------------------------------------------------------
    | default_limit: max timelines returned by selectBest (0 = no limit).
    | narrative_weights: novelty, complexity, divergence, depth, tension (sum ~1).
    |   tension = entropy in "interesting" range (0.3–0.7) for story potential.
    */
    'timeline_selection' => [
        'default_limit' => (int) env('WORLDOS_TIMELINE_SELECTION_LIMIT', 10),
        'narrative_weights' => [
            'novelty' => (float) env('WORLDOS_TSE_WEIGHT_NOVELTY', 0.25),
            'complexity' => (float) env('WORLDOS_TSE_WEIGHT_COMPLEXITY', 0.25),
            'divergence' => (float) env('WORLDOS_TSE_WEIGHT_DIVERGENCE', 0.20),
            'depth' => (float) env('WORLDOS_TSE_WEIGHT_DEPTH', 0.15),
            'tension' => (float) env('WORLDOS_TSE_WEIGHT_TENSION', 0.15),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Narrative Extraction: timeline → story/lore (Phase D)
    |--------------------------------------------------------------------------
    | default_limit: max universes to extract when using extractBestFromWorld/Saga.
    | chronicle_type: type stored in Chronicle when extracting (lore / story).
    */
    'narrative_extraction' => [
        'default_limit' => (int) env('WORLDOS_NARRATIVE_EXTRACTION_LIMIT', 5),
        'chronicle_type' => env('WORLDOS_NARRATIVE_EXTRACTION_TYPE', 'lore'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Civilization Memory: aggregate key events per universe (Phase E)
    |--------------------------------------------------------------------------
    | max_events: cap on key_events returned; max_chronicles: cap for context.
    */
    'civilization_memory' => [
        'max_events' => (int) env('WORLDOS_CIV_MEMORY_MAX_EVENTS', 50),
        'max_chronicles' => (int) env('WORLDOS_CIV_MEMORY_MAX_CHRONICLES', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Mythology Generator: chronicle type for generated myth (Phase F)
    |--------------------------------------------------------------------------
    */
    'mythology_generator' => [
        'chronicle_type' => env('WORLDOS_MYTHOLOGY_CHRONICLE_TYPE', 'myth'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Ideology Evolution: aggregate ideology from institutions (Phase G)
    |--------------------------------------------------------------------------
    */
    'ideology_evolution' => [
        'store_in_state_vector' => (bool) env('WORLDOS_IDEOLOGY_STORE_IN_STATE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Great Person: conditions to spawn SupremeEntity (Phase H)
    |--------------------------------------------------------------------------
    | entropy_min/max: universe entropy range for spawn. min_institutions: min active institutions.
    | cooldown_ticks: min ticks since last supreme_emergence in this universe.
    */
    'great_person' => [
        'entropy_min' => (float) env('WORLDOS_GREAT_PERSON_ENTROPY_MIN', 0.3),
        'entropy_max' => (float) env('WORLDOS_GREAT_PERSON_ENTROPY_MAX', 0.75),
        'min_institutions' => (int) env('WORLDOS_GREAT_PERSON_MIN_INSTITUTIONS', 1),
        'cooldown_ticks' => (int) env('WORLDOS_GREAT_PERSON_COOLDOWN_TICKS', 500),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pulse: run Ideology & Great Person each pulse (Phase K)
    |--------------------------------------------------------------------------
    */
    'pulse' => [
        'run_ideology' => (bool) env('WORLDOS_PULSE_RUN_IDEOLOGY', true),
        'run_great_person' => (bool) env('WORLDOS_PULSE_RUN_GREAT_PERSON', true),
    ],
];
