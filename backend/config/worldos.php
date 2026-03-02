<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Simulation Engine (Rust gRPC)
    |--------------------------------------------------------------------------
    */
    'simulation_engine_grpc_url' => env('SIMULATION_ENGINE_GRPC_URL', 'localhost:50051'),

    'narrative_llm_url' => env('NARRATIVE_LLM_URL', ''),

    'memory' => [
        'driver' => env('WORLDOS_MEMORY_DRIVER', 'db_json'),
        'max_candidates' => (int) env('WORLDOS_MEMORY_MAX_CANDIDATES', 500),
        'embedding_model' => env('WORLDOS_MEMORY_EMBEDDING_MODEL', 'hashing-384'),
        'embedding_version' => env('WORLDOS_MEMORY_EMBEDDING_VERSION', 'v1'),
    ],

];
