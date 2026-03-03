<?php

namespace App\Services\Saga;

use App\Models\Saga;
use App\Models\Universe;
use App\Models\World;
use App\Services\Simulation\UniverseRuntimeService;

class SagaService
{
    public function __construct(
        protected UniverseRuntimeService $runtime,
        protected \App\Services\Simulation\OriginSeeder $originSeeder
    ) {}

    /**
     * Spawn a new universe for a world (optionally forked from parent).
     */
    public function spawnUniverse(World $world, ?int $parentUniverseId = null, ?int $sagaId = null, ?array $branchPayload = null): Universe
    {
        $parent = null;
        $initialState = null;
        $startTick = 0;

        // If sagaId is not provided, find or create an implicit one for the world
        if (!$sagaId) {
            $saga = $world->sagas()->firstOrCreate(
                ['name' => 'Default Saga of ' . $world->name],
                ['status' => 'active']
            );
            $sagaId = $saga->id;
        }

        if ($parentUniverseId) {
            $parent = Universe::find($parentUniverseId);
            if ($parent) {
                // Inherit latest state or state at fork tick
                $latest = $parent->snapshots()->orderByDesc('tick')->first();
                $initialState = $latest?->state_vector ?? $parent->state_vector;
                $startTick = $latest?->tick ?? $parent->current_tick;
            }
        }

        // Apply mutation from branchPayload if any (e.g. reduce entropy, boost innovation)
        if ($initialState && !empty($branchPayload['mutation'])) {
             // Branch Injection: modify state vector based on mutation payload
             $mutation = $branchPayload['mutation'];
             if (isset($mutation['suggest_reduce_entropy']) && $mutation['suggest_reduce_entropy']) {
                 // Reduce entropy by 10%
                 $currentEntropy = $initialState['entropy'] ?? 1.0;
                 $initialState['entropy'] = max(0, $currentEntropy * 0.9);
                 $initialState['mutation_note'] = 'Entropy reduced by Branch Injection';
             }
             // Handle other mutation types here (e.g. boost innovation)
        }

        // Phase 26: Inject Meta-Edicts from World Axiom
        $axiom = $world->axiom ?? [];
        $metaEdicts = $axiom['meta_edicts'] ?? [];
        if (!empty($metaEdicts)) {
            $initialState = $initialState ?? [];
            // We store them in a temporary structure that WorldEdictEngine will pick up
            // or we can just let WorldEdictEngine::decree handle it.
            // For immediate effect in the very first tick, we ensure they are considered.
            $initialState['inherited_meta_edicts'] = array_keys($metaEdicts);
        }

        $name = $world->name . ' - ' . ($parentUniverseId ? 'Branch' : 'Genesis') . ' (' . now()->format('H:i:s') . ')';

        $universe = Universe::create([
            'name' => $name,
            'world_id' => $world->id,
            'saga_id' => $sagaId,
            'multiverse_id' => $world->multiverse_id,
            'parent_universe_id' => $parentUniverseId,
            'current_tick' => $startTick,
            'status' => 'active',
            'state_vector' => $initialState,
        ]);

        // Phase 21: Inject External Shock if it's a fork
        if ($parentUniverseId && $branchPayload) {
            app(\App\Actions\Simulation\InjectExternalShockAction::class)->execute($universe, $branchPayload);
        }

        // Phase 26: Seed Origin if it's a new root universe
        if (!$parentUniverseId) {
            $this->originSeeder->seed($universe);
        }

        return $universe;
    }

    /**
     * Fork universe at given tick (create child universe from parent state).
     */
    public function fork(Universe $universe, int $fromTick): Universe
    {
        return $this->spawnUniverse(
            $universe->world,
            $universe->id,
            $universe->saga_id
        );
    }
}
