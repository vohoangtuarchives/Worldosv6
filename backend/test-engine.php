<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\Simulation\HttpSimulationEngineClient;

echo "Creating client targeting 127.0.0.1:50052...\n";
$client = new HttpSimulationEngineClient('http://127.0.0.1:50052');

$stateObj = [
    'universe_id' => 1,
    'tick' => 0,
    'zones' => [],
    'global_entropy' => 0.0,
    'knowledge_core' => 0.0,
    'scars' => []
];

echo "Calling advance...\n";
$result = $client->advance(1, 10, json_encode($stateObj));

echo json_encode($result, JSON_PRETTY_PRINT) . "\n";
