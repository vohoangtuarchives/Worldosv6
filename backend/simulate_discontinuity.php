<?php

use App\Models\Universe;
use App\Models\World;
use App\Simulation\Runtime\SimulationKernel;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. Setup Universe
DB::table('universes')->truncate();
DB::table('actors')->truncate();
DB::table('factions')->truncate();
DB::table('legendary_agents')->truncate();

$world = World::first() ?? World::create(['name' => 'Gaia', 'description' => 'Discontinuity Test World']);
$universe = Universe::create([
    'world_id' => $world->id,
    'name' => 'Aeon of Discontinuity',
    'status' => 'active',
    'entropy' => 0.4,
    'structural_coherence' => 0.8,
    'current_tick' => 0,
    'state_vector' => [
        'phase_score' => ['primitive' => 1.0, 'feudal' => 0.0, 'industrial' => 0.0, 'information' => 0.0, 'fragmented' => 0.0],
        'fields' => ['survival' => 0.6, 'reproduction' => 0.5, 'wealth' => 0.1, 'power' => 0.1, 'knowledge' => 0.05, 'meaning' => 0.1, 'status' => 0.1, 'belonging' => 0.3],
        'institutions' => [],
        'active_catalysts' => [],
        'legacy' => [
            'knowledge_floor' => 0.0,
            'stability_floor' => 0.0,
            'culture_floor' => 0.0
        ]
    ]
]);

// 2. Spawn initial population
$actorRepo = app(ActorRepositoryInterface::class);
for ($i = 0; $i < 20; $i++) {
    $actorRepo->save(new \App\Modules\Intelligence\Entities\ActorEntity(
        id: null,
        universeId: $universe->id,
        name: "Founder " . ($i + 1),
        archetype: 'gatherer',
        traits: [
            'Curiosity' => 0.3 + (rand(0, 70) / 100),
            'Dominance' => 0.2 + (rand(0, 60) / 100),
            'Ambition' => 0.2 + (rand(0, 60) / 100),
            'Pragmatism' => 0.4 + (rand(0, 50) / 100),
            'Resilience' => 0.6 + (rand(0, 40) / 100),
            'Longevity' => 0.5
        ],
        metrics: ['energy' => 150, 'max_energy' => 200, 'physic' => [0.5, 0.5, 0.5, 0.5, 0.5]]
    ));
}

$kernel = app(SimulationKernel::class);

echo "Starting Discontinuity Simulation...\n";
echo "Step | K-Field | W-Field | P-Field | Heroes | Catalysts | Phase\n";
echo "---------------------------------------------------------------\n";

$maxTicks = 2000;
for ($tick = 1; $tick <= $maxTicks; $tick++) {
    $kernel->tick($universe);
    $universe->refresh();

    if ($tick % 50 === 0) {
        $fields = $universe->state_vector['fields'] ?? [];
        $heroCount = DB::table('actors')->where('universe_id', $universe->id)->where('is_heroic', true)->where('is_alive', true)->count();
        $catalysts = count($universe->state_vector['active_catalysts'] ?? []);
        $phase = array_search(max($universe->state_vector['phase_score']), $universe->state_vector['phase_score']);

        printf("%4d | %7.4f | %7.4f | %7.4f | %6d | %9d | %s\n", 
            $tick, 
            $fields['knowledge'] ?? 0, 
            $fields['wealth'] ?? 0,
            $fields['power'] ?? 0,
            $heroCount,
            $catalysts,
            $phase
        );
        
        // Check for legendary legacies
        $totalLegacy = count($universe->state_vector['historical_scars'] ?? []);
        if ($totalLegacy > 0 && $tick % 200 === 0) {
             echo ">>> Scars detected: $totalLegacy. Foundations strengthening.\n";
        }
    }
}

echo "---------------------------------------------------------------\n";
echo "Simulation Finished.\n";
