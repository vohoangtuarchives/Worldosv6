<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI Driver
    |--------------------------------------------------------------------------
    |
    | This value determines which of the following gateways to use by default
    | for all AI-powered features in the WorldOS simulation.
    |
    */

    'default' => env('AI_DRIVER', 'zai'),

    /*
    |--------------------------------------------------------------------------
    | AI Drivers Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the AI drivers used by your application.
    |
    */

    'drivers' => [

        'zai' => [
            'url'   => env('NARRATIVE_LLM_URL', 'https://api.z.ai/api/paas/v4/chat/completions'),
            'key'   => env('NARRATIVE_LLM_KEY'),
            'model' => env('NARRATIVE_LLM_MODEL', 'GLM-4.5-Flash'),
        ],

        'openai' => [
            'url'   => 'https://api.openai.com/v1/chat/completions',
            'key'   => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL', 'gpt-4o'),
        ],

        'local' => [
            'url'   => env('LOCAL_LLM_URL', 'http://host.docker.internal:11434/v1/chat/completions'),
            'model' => env('LOCAL_LLM_MODEL', 'mistral'),
        ],

        'openrouter' => [
            'url'   => env('OPENROUTER_URL', 'https://openrouter.ai/api/v1/chat/completions'),
            'key'   => env('OPENROUTER_API_KEY'),
            'model' => env('OPENROUTER_MODEL', 'minimax/minimax-m2.5:free'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | AI Feature Mapping
    |--------------------------------------------------------------------------
    |
    | Map specific WorldOS features to specific AI drivers.
    |
    */

    'features' => [
        'analytical' => env('AI_FEATURE_ANALYTICAL', 'zai'),
        'narrative'  => env('AI_FEATURE_NARRATIVE', 'zai'),
        'lab'        => env('AI_FEATURE_LAB', 'zai'),
        'decision'   => env('AI_FEATURE_DECISION', 'zai'),
    ],

];

