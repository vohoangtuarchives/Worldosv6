<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Simulation\Runtime\State\StateManager;
use App\Models\Universe;

echo "Resolving StateManager...\n";
$stateManager = $app->make(StateManager::class);
echo "Resolved.\n";

echo "Fetching real universe...\n";
$universe = Universe::find(2);
if (!$universe) {
    die("Universe 2 not found\n");
}
echo "Found universe with state_vector size: " . (is_array($universe->state_vector) ? count($universe->state_vector) : 'not array') . "\n";

echo "Calling load...\n";
try {
    $stateManager->load($universe);
    echo "Load finished successfully.\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
