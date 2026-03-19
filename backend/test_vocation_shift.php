<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Universe;
use App\Models\World;
use App\Simulation\Runtime\WorldKernel;
use App\Simulation\Runtime\State\StateManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

echo "--- End-to-End Vocation Shift Verification ---\n";

// 1. Setup a Test World & Universe
$world = World::firstOrCreate([
    'slug' => 'vocation-test-world',
], [
    'name' => 'Vocation Test World',
    'primary_ruleset_id' => 'wuxia_basic',
    'global_tick' => 0,
    'current_genre' => 'wuxia',
    'base_genre' => 'wuxia',
    'is_autonomic' => true,
    'multiverse_id' => 1,
]);

$universe = Universe::updateOrCreate([
    'world_id' => $world->id,
], [
    'current_tick' => 0,
    'axioms' => [
        'destiny_gradient' => 0.8,   // High destiny -> METAPHYSICAL drift
        'causal_curiosity' => 0.4,
    ],
    'state_vector' => [
        'entropy' => 0.1,
        'stability_index' => 0.9,
    ],
]);

echo "Universe #{$universe->id} initialized with Wuxia RuleSet.\n";
echo "Axioms: " . json_encode($universe->axioms) . "\n\n";

// 2. Clear previous actors to avoid noise
DB::table('actors')->where('universe_id', $universe->id)->delete();

// 3. Create a Test Actor (A Commoner)
$actor = \App\Models\Actor::create([
    'universe_id' => $universe->id,
    'name' => 'Lâm Phàm',
    'archetype' => 'commoner',
    'is_alive' => true,
    'vocation_id' => 'v_peasant', // Start as Peasant
    'traits' => [
        0.3, 0.8, 0.2, // Dom, Amb, Coe
        0.4, 0.6, 0.5, 0.5, // Loy, Emp, Sol, Con
        0.5, 0.9, 0.4, 0.6, // Pra, Cur, Dog, Ris
        0.3, 0.1, 0.8, 0.1, 0.6, 0.2 // Fea, Ven, Hop, Gri, Pri, Sha
    ],
]);

echo "Actor: {$actor->name} (Current Vocation: {$actor->vocation_id})\n";

// 4. Run Simulation Ticks
/** @var WorldKernel $kernel */
$kernel = $app->make(WorldKernel::class);
/** @var StateManager $stateManager */
$stateManager = $app->make(StateManager::class);

$ticks = 5;
echo "Running $ticks simulation ticks...\n";

$universe = \App\Models\Universe::find($universe->id);
echo "Universe re-fetched. State vector: " . json_encode($universe->state_vector) . "\n";

for ($t = 1; $t <= $ticks; $t++) {
    echo "\n--- TICK $t ---\n";
    $state = $stateManager->load($universe);
    
    echo "DEBUG: Advancing world simulation tick (FFI)...\n";
    $kernel->finalizeNarrativeEmergence($state, $t);

    // 5. Verification: Check Motivation Drift & Vocation Shift
    $updatedActor = \App\Models\Actor::find($actor->id);
    $motivation = $updatedActor->metrics['motivation_profile'] ?? [];
    
    echo "Actor: {$updatedActor->name}\n";
    echo "Current Vocation: {$updatedActor->vocation_id}\n";
    printf("Motivation (8D): C:%.2f D:%.2f O:%.2f K:%.2f S:%.2f A:%.2f P:%.2f M:%.2f\n",
        $motivation['creation'] ?? 0, $motivation['destruction'] ?? 0,
        $motivation['order'] ?? 0, $motivation['chaos'] ?? 0,
        $motivation['self_preservation'] ?? 0, $motivation['altruism'] ?? 0,
        $motivation['physical'] ?? 0, $motivation['metaphysical'] ?? 0
    );
}

echo "\nSimulation finished at tick $ticks.\n";

// 5. Check Results (Conceptual for this Phase)
// We look at the Chronicle for "EMERGENT_SCAR" or "vocation_change" events.
$scars = DB::table('chronicles')
    ->where('universe_id', $universe->id)
    ->where('type', 'EMERGENT_SCAR')
    ->get();

echo "Emergent Scars: " . $scars->count() . "\n";
foreach ($scars as $scar) {
    echo "- [Tick {$scar->from_tick}] {$scar->content}\n";
}

echo "\n--- End of Verification ---\n";
