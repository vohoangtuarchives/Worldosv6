<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\Actor;
use App\Models\Universe;
use App\Simulation\Runtime\Stages\VectorizedActorStage;
use App\Services\Simulation\FfiActorEngine;
use App\Simulation\Runtime\State\StateManager;
use App\Modules\Intelligence\Entities\ActorEntity;

// Initialize Laravel App
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Vectorized Actor Engine Test ---\n";

// 1. Setup Mock Universe and State
$universe = new Universe();
$universe->id = 999;
$universe->seed = 12345;

/** @var StateManager $stateManager */
$stateManager = $app->make(StateManager::class);
// Manual State creation to avoid DB connection in unit test
$state = new \App\Simulation\Runtime\State\WorldState([
    'universe_id' => 999,
    'seed' => 12345
]);
// Inject state into manager if needed (though we'll use it directly)
$ref = new ReflectionProperty(StateManager::class, 'currentState');
$ref->setAccessible(true);
$ref->setValue($stateManager, $state);

// 2. Create Mock Actors
$actors = [];
for ($i = 1; $i <= 10; $i++) {
    $entity = new ActorEntity(
        id: $i,
        universeId: 999,
        name: "Actor $i",
        archetype: "Commoner",
        metrics: [
            'energy' => 100,
            'needs' => ['hunger' => 0.5, 'safety' => 0.3],
            'trauma' => 0.0,
        ]
    );
    $actors[] = $entity;
}
$state->setActorEntities($actors);

// 3. Instantiate VectorizedActorStage
$ffiEngine = $app->make(FfiActorEngine::class);
$stage = new VectorizedActorStage($ffiEngine, $stateManager);

echo "Initial State (Actor 1): Hunger: 0.5, Energy: 100, Trauma: 0.0\n";

// 4. Run Tick 1 (Normal)
echo "Running Tick 1...\n";
$stage->run($universe, 1);

$actor1 = $state->getActorEntities()[0];
$m1 = $actor1->metrics;
echo "Tick 1 Result (Actor 1): Hunger: {$m1['needs']['hunger']}, Energy: {$m1['energy']}, Trauma: {$m1['trauma']}, Action: {$m1['behavior_state']}\n";

// 5. Force High Fear / Trauma to test persistence
echo "Injecting high fear (0.95) into Actor 1...\n";
$m1['needs']['safety'] = 0.95;
$actor1->metrics = $m1;

echo "Running Tick 2 (Trauma Spike)...\n";
$stage->run($universe, 2);

$m1 = $actor1->metrics;
echo "Tick 2 Result (Actor 1): Hunger: {$m1['needs']['hunger']}, Energy: {$m1['energy']}, Trauma: {$m1['trauma']}, Action: {$m1['behavior_state']}\n";

// 6. Verify Determinism (Same Seed = Same Result)
echo "Verifying Determinism (Running Tick 3 twice with reset)...\n";
$savedState = serialize($actor1->metrics);

$stage->run($universe, 3);
$result1 = $actor1->metrics;

$actor1->metrics = unserialize($savedState);
$stage->run($universe, 3);
$result2 = $actor1->metrics;

if ($result1 === $result2) {
    echo "SUCCESS: Determinism verified via tick-specific seeds!\n";
} else {
    echo "FAILURE: Non-deterministic behavior detected!\n";
}

echo "--- Test Complete ---\n";
