<?php

use App\Models\Universe;
use App\Modules\Intelligence\Entities\ActorEntity;
use App\Modules\Intelligence\Services\GreatPersonEngine;
use App\Modules\Intelligence\Services\CatalystEngine;
use App\Modules\Intelligence\Services\InstitutionEngine;
use App\Modules\Intelligence\Services\LegacySystem;
use App\Modules\Intelligence\Services\InnovationEngine;
use App\Modules\Intelligence\Services\PolityCompetitionEngine;
use App\Modules\Intelligence\Services\IdeaDiffusionEngine;
use App\Modules\Intelligence\Services\MacroAgentEngine;
use App\Services\Simulation\SimulationPRNG;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. Setup Mock Universe (Pure In-Memory State)
$universe = new Universe();
$universe->id = 1;
$universe->current_tick = 0;
$universe->entropy = 0.4;
$universe->structural_coherence = 0.8;
$universe->state_vector = [
    'phase_score' => ['primitive' => 1.0, 'feudal' => 0.0, 'industrial' => 0.0, 'information' => 0.0, 'fragmented' => 0.0],
    'fields' => ['survival' => 0.6, 'reproduction' => 0.5, 'wealth' => 0.1, 'power' => 0.1, 'knowledge' => 0.05, 'meaning' => 0.1, 'status' => 0.1, 'belonging' => 0.3],
    'institutions' => [],
    'active_catalysts' => [],
    'legacy' => [
        'knowledge_floor' => 0.0,
        'stability_floor' => 0.0,
        'culture_floor' => 0.0
    ],
    'historical_scars' => []
];

// Use deterministic PRNG seeded from universe (tick=0)
$prng = SimulationPRNG::forUniverse($universe);
$gpEngine = new GreatPersonEngine($prng);
$catEngine = new CatalystEngine($prng);
$instEngine = new InstitutionEngine();
$legacySystem = new LegacySystem();
$innovEngine = new InnovationEngine();
$polityEngine = new PolityCompetitionEngine();
$ideaEngine = new IdeaDiffusionEngine();

/**
 * In-memory Mock Repository for the simulation script.
 */
class MockActorRepository implements \App\Modules\Intelligence\Contracts\ActorRepositoryInterface {
    public array $actors = [];
    public function findById(int $id): ?\App\Modules\Intelligence\Entities\ActorEntity {
        foreach ($this->actors as $a) if ($a->id === $id) return $a;
        return null;
    }
    public function find(int $id): ?\App\Modules\Intelligence\Entities\ActorEntity { return $this->findById($id); }
    public function findByUniverse(int $universeId): array { return $this->actors; }
    public function findActiveByUniverse(int $universeId): array { 
        return array_filter($this->actors, fn($a) => $a->isAlive); 
    }
    public function save(\App\Modules\Intelligence\Entities\ActorEntity $actor): void { $this->actors[] = $actor; }
    public function delete(int $id): void {}
    public function getActiveCount(int $universeId): int { return count($this->findActiveByUniverse($universeId)); }
}

$mockActorRepo = new MockActorRepository();
$macroEngine = new MacroAgentEngine($mockActorRepo);
$dynastyEngine = new \App\Modules\Intelligence\Services\DynastyEngine($mockActorRepo);

// 3. Setup Actors — all PRNG-seeded for determinism
$actors = [];
for ($i = 0; $i < 40; $i++) {
    $curiosity = 0.3 + ($prng->nextInt(0, 40) / 100);
    $dominance  = 0.3 + ($prng->nextInt(0, 40) / 100);
    $hope       = 0.3 + ($prng->nextInt(0, 40) / 100);
    $resilience = 0.6;
    
    if ($i === 0) { $curiosity = 0.98; }        // Scientist
    if ($i === 1) { $dominance = 0.95; $resilience = 0.9; } // General
    if ($i === 2) { $hope = 0.99; }              // Prophet

    $actors[] = new ActorEntity(
        id: $i + 1,
        universeId: 1,
        name: "Founder " . ($i + 1),
        archetype: 'gatherer',
        traits: [
            'Curiosity'   => $curiosity,
            'Dominance'   => $dominance,
            'Ambition'    => 0.3 + ($prng->nextInt(0, 40) / 100),
            'Pragmatism'  => 0.4 + ($prng->nextInt(0, 40) / 100),
            'Resilience'  => $resilience,
            'Longevity'   => 0.9, 
            'Hope'        => $hope
        ],
        metrics: [
            'energy'         => 150, 
            'max_energy'     => 200, 
            'physic'         => [0.5, 0.5, 0.5, 0.5, 0.5],
            'behavior_stats' => ['battles' => 0, 'research' => 0, 'trade' => 0, 'spiritual' => 0]
        ],
        isAlive: true,
        generation: 1
    );
}

echo "\n--- WorldOS Civilization Lifecycle Simulation (Dynasty & Lineage) ---\n";
echo "Step | K-Field | W-Field | Army Leader    | Lineage / Scars               | Phase\n";
echo "--------------------------------------------------------------------------------\n";

// 5. Founders for personification
$founder1 = $actors[0];
$founder2 = $actors[1];
$founder3 = $actors[2];

$founder1->isHeroic = true; $founder1->heroicType = 'SCIENTIST';
$founder2->isHeroic = true; $founder2->heroicType = 'GENERAL';
$founder3->isHeroic = true; $founder3->heroicType = 'PROPHET';

$mockActorRepo->actors = $actors;

// Determine dynamic dynasty transition tick from seed (repeatable, not hardcoded)
$dynastyTransitionTick = $prng->nextInt(400, 700);

$maxTicks = 1000;
for ($tick = 1; $tick <= $maxTicks; $tick++) {
    // Update PRNG seed to be tick-aware (tick-based seeding for per-tick determinism)
    $universe->current_tick = $tick;
    $tickPrng = SimulationPRNG::forUniverse($universe);
    
    $stateVector = $universe->state_vector;
    $fields = &$stateVector['fields'];
    $cohesion = 0.5; // Simplified

    // A. Crystallization
    foreach ($actors as &$actor) {
        if ($actor->isAlive && !$actor->isHeroic) {
            $actorState = $actor->toState();
            // BOOSTING: Lower threshold artificially for demonstration
            $heroicType = $gpEngine->evaluateCrystallization($actorState, $universe, $fields, $cohesion + 2.0); 
            if ($heroicType) {
                $actor->isHeroic = true;
                $actor->heroicType = $heroicType;
                $actor->name .= " (" . GreatPersonEngine::TYPES[$heroicType] . ")";
                echo "[TICK $tick] CRYSTALLIZATION: {$actor->name} has emerged!\n";
                // Phase 50.1: Sow Idea
                $ideaEngine->sowIdea($universe, $actor->toState());
            }
        }
    }

    // B. Aura & Catalyst
    foreach ($actors as $actor) {
        if ($actor->isAlive && $actor->isHeroic) {
            $fieldKey = match($actor->heroicType) {
                'SCIENTIST'        => 'knowledge',
                'GENERAL', 'RULER' => 'power',
                'MERCHANT'         => 'wealth',
                'PROPHET'          => 'meaning',
                'ARTIST'           => 'status',
                default            => 'survival'
            };
            $fields[$fieldKey] = min(1.0, ($fields[$fieldKey] ?? 0) + 0.15); // HYPER-AGGRESSIVE aura
        }
    }

    // [PHASE 48] Innovation & Stagnation
    $innovEngine->step($universe);
    $stateVector = $universe->state_vector; // Refresh
    $innovMod = $innovEngine->getInnovationModifier($stateVector['innovation_metrics'] ?? []);
    $fields['knowledge'] *= $innovMod;
    $fields['wealth'] *= $innovMod;

    // [PHASE 46] Institution Step
    $instEngine->step($universe);
    $stateVector = $universe->state_vector; // Refresh
    $instMods = $instEngine->getInstitutionalModifiers($stateVector['institutions'] ?? []);
    foreach ($instMods as $field => $mod) {
        if (isset($fields[$field])) $fields[$field] = min(1.0, $fields[$field] * $mod);
    }

    // [PHASE 50] Idea Diffusion
    $ideaEngine->step($universe);
    $stateVector = $universe->state_vector;

    // [PHASE 49] Geopolitical Competition
    $polityEngine->step($universe);
    
    // [PHASE 51] Macro Agent Execution
    $macroEngine->step($universe);
    
    // [PHASE 52] Dynasty / Legacy Logic
    // Dynasty transition at a PRNG-derived tick (not hardcoded) — still fully reproducible
    if ($tick === $dynastyTransitionTick) {
        $founder2 = $mockActorRepo->findById(2);
        if ($founder2) {
            $founder2->isAlive = false;
            $heir = new ActorEntity(
                id: 200, universeId: 1, name: "Alexander II", archetype: "General",
                traits: [], metrics: [], isAlive: true, generation: 2
            );
            $dynastyEngine->inherit($heir, $founder2);
            $mockActorRepo->save($heir);
            echo "[TICK $tick] DYNASTY EMERGENCE: {$heir->name} has inherited the command!\n";
        }
    }
    
    $stateVector = $universe->state_vector;

    $activeCats = $catEngine->evaluateCatalysts($universe, $fields, $universe->entropy);
    $catEngine->applyAmplification($fields, $activeCats);

    // C. Legacy Check — deterministic death chance via tick-PRNG
    foreach ($actors as &$actor) {
        if ($actor->isAlive && $tickPrng->nextFloat() < 0.005) { // 0.5% death chance/tick (deterministic)
            $actor->isAlive = false;
            if ($actor->isHeroic) {
                // Phase 47.3: Spawn Institution
                $instEngine->spawnFromHero($universe, $actor->toState());
                $stateVector = $universe->state_vector;

                $legacySystem->imprintLegacy($universe, $actor->toState());
                $stateVector = $universe->state_vector;
                echo "[TICK $tick] DEATH & LEGACY: {$actor->name} passed away, leaving a foundation.\n";
            }
        }
    }
    
    // D. Apply Legacy Floors (Phase 47.2 preservation_rate)
    $legacySystem->applyFloors($fields, $stateVector['legacy']);

    // E. Evolution (Simplified growth)
    $fields['knowledge'] = min(1.0, $fields['knowledge'] + 0.0001);
    $fields['wealth']    = min(1.0, $fields['wealth'] + 0.0001);

    $universe->state_vector = $stateVector;

    if ($tick % 100 === 0) {
        $aliveHeroes = array_filter($actors, fn($a) => $a->isAlive && $a->isHeroic);
        $heroCount   = count($aliveHeroes);
        $catCount    = count($universe->state_vector['active_catalysts']);
        $instCount   = count(array_filter($stateVector['institutions'], fn($i) => $i['state'] !== 'COLLAPSE'));
        $polityCount = count($stateVector['polities'] ?? []);
        $ideaCount   = count($stateVector['ideas'] ?? []);
        $schoolCount = count($stateVector['schools'] ?? []);
        $army        = $stateVector['macro_agents'][0] ?? null;
        $leader      = $army['leader_name'] ?? 'None';
        
        $heir    = $mockActorRepo->findById(200);
        $scars   = $heir ? count($heir->metrics['historical_scars'] ?? []) : 0;
        $lineage = $heir ? "Alexander II (Scars: $scars)" : "None";

        $phase = $fields['knowledge'] > 0.6 ? 'Industrial' : 'Primitive';

        printf("%4d | %7.4f | %7.4f | %15s | %25s | %s\n", 
            $tick, $fields['knowledge'], $fields['wealth'], $leader, $lineage, $phase
        );
    }
}

echo "---------------------------------------------------------------\n";
echo "Final Legacy State:\n";
print_r($universe->state_vector['legacy']);
echo "Simulation Finished.\n";
