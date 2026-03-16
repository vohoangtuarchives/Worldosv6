<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernelConsole = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernelConsole->bootstrap();

use App\Simulation\Runtime\WorldKernel;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Systems\ResourceSystem;
use App\Simulation\Runtime\Systems\ConflictSystem;
use App\Modules\World\Entities\ResourceEntity;

echo "--- Testing WorldKernel V81 (Strict Layered Isolation) ---\n";

$state = new WorldState([
    'fields' => [
        'survival' => 0.5,
        'wealth' => 0.2, // Results in high resource scarcity
        'entropy' => 0.1,
    ],
    'ecosystem' => [
        'resource_scarcity' => 0.9,
    ],
    'entropy' => 0.1,
    'stability_index' => 0.9,
]);

$resource = new ResourceEntity(
    id: "test_gold",
    type: "gold",
    quantity: 100.0,
    scarcity: 0.5
);

$state->setResourceEntities([$resource]);

/** @var WorldKernel $kernel */
$kernel = app(WorldKernel::class);

// Manually register systems for testing
$kernel->registerSystem(WorldKernel::PHASE_ENVIRONMENT, WorldKernel::RULE_EXTRACTION, new ResourceSystem());
$kernel->registerSystem(WorldKernel::PHASE_META, WorldKernel::RULE_CONFLICT, new ConflictSystem());

echo "Initial State: Entropy=" . $state->getEntropy() . ", Resource Qty=" . $state->getResourceEntities()[0]->quantity . "\n";

echo "Executing WorldKernel phase execution...\n";
$kernel->execute($state, 1);

echo "Final State: Entropy=" . $state->getEntropy() . ", Resource Qty=" . $state->getResourceEntities()[0]->quantity . "\n";

// Verification
$success = true;

// ResourceSystem should have reduced quantity because scarcity is high
if ($state->getResourceEntities()[0]->quantity >= 100.0) {
    echo "❌ FAILURE: Resource quantity did not decrease.\n";
    $success = false;
}

// ConflictSystem should have increased entropy because scarcity is high (>0.8)
if ($state->getEntropy() <= 0.1) {
    echo "❌ FAILURE: Entropy did not increase via mutation.\n";
    $success = false;
}

if ($success) {
    echo "\n✅ SUCCESS: WorldKernel V81 Isolation Refactor verified!\n";
} else {
    echo "\n❌ FAILURE: Refactor verification failed.\n";
    exit(1);
}
