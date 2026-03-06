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
    | Simulation Kernel (Laravel-side post-tick)
    |--------------------------------------------------------------------------
    | When true, after Rust engine saves snapshot, run SimulationKernel and
    | overwrite snapshot with kernel output (deterministic, effect-based).
    */
    'simulation_kernel_post_tick' => env('SIMULATION_KERNEL_POST_TICK', false),

    'potential_field_war_threshold' => (float) env('WORLDOS_POTENTIAL_FIELD_WAR_THRESHOLD', 0.85),

    /*
    |--------------------------------------------------------------------------
    | Time-Scale Engine (tick factors)
    |--------------------------------------------------------------------------
    | Engines run only when tick % factor === 0. Event=1, Knowledge=10, Civilization=100, etc.
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

];
