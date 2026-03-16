<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\Narrative\UniverseHistoryGenerator;
use App\Models\Universe;
use App\Contracts\CausalityGraphServiceInterface;

$universeId = 1; // Assuming universe 1 exists in development
$universe = Universe::find($universeId);

if (!$universe) {
    echo "Universe #$universeId not found. Please ensure you have seeded your database.\n";
    exit(1);
}

echo "Testing UniverseHistoryGenerator for Universe #$universeId...\n";

$causalityGraph = app(\App\Contracts\CausalityGraphServiceInterface::class);

echo "Seeding mock causal relations...\n";
$causalityGraph->recordRelation(
    "ecological_collapse_tick_50",
    "population_decline_tick_60",
    "caused_by",
    60,
    ['universe_id' => 1, 'reason' => 'Famine following collapse']
);

/** @var UniverseHistoryGenerator $generator */
$generator = app(UniverseHistoryGenerator::class);

// We'll use a reflection trick to inspect the buildContext output if possible,
// or just run the generate method.
// Since generate() calls BuildContext internally, we can mock or just check logs.

// For verification, I'll just check if the class can be resolved first.
try {
    $context = (new \ReflectionClass($generator))
        ->getMethod('buildContext')
        ->invoke($generator, $universe->id, 0, 100);
        
    echo "--- Generated Context Preview ---\n";
    echo substr($context, 0, 1000) . "...\n";
    
    if (str_contains($context, 'CAUSAL CONTEXT (REALITY OS TRACES)')) {
        echo "\n✅ SUCCESS: Causal Context found in the history generator!\n";
    } else {
        echo "\n❌ FAILURE: Causal Context missing from the history generator.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
