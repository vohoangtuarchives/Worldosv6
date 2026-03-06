<?php

namespace App\Services\Saga;

use App\Models\Saga;
use App\Models\Universe;
use App\Models\World;
use App\Services\Simulation\UniverseRuntimeService;
use Illuminate\Support\Facades\Log;

class SagaService
{
    public function __construct(
        protected UniverseRuntimeService $runtime,
        protected \App\Services\Simulation\OriginSeeder $originSeeder,
        protected \App\Services\Simulation\KernelMutationService $mutationService
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
                
                // Inherit and Mutate Genome
                $parentGenome = $parent->kernel_genome ?? [];
                $childGenome = $this->mutationService->mutate($parentGenome);
            }
        } else {
            // Genesis: start with default genome
            $childGenome = null; // Will be set by create below if default needed, or explicitly here
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
        
        // Phase 64: Inspiration Recycling (§V10)
        $seed = $world->world_seed ?? [];
        if (!empty($seed['inspiration_pool']) && $seed['inspiration_pool'] > 0) {
            $initialState = $initialState ?? [];
            $boost = $seed['inspiration_pool'];
            $initialState['entropy'] = max(0, ($initialState['entropy'] ?? 1.0) - $boost);
            Log::info("SOVEREIGNTY: Applying Inspiration Boost of {$boost} to new Universe.");
            
            // Consume the pool
            $seed['inspiration_pool'] = 0;
            $world->update(['world_seed' => $seed]);
        }

        if (!empty($metaEdicts)) {
            $initialState = $initialState ?? [];
            // We store them in a temporary structure that Institutions/WorldEdictEngine will pick up
            // or we can just let Institutions/WorldEdictEngine::decree handle it.
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
            'kernel_genome' => $childGenome ?? null,
        ]);
        
        // Ensure genome is set (default if null)
        $this->mutationService->ensureGenome($universe);

        // Phase 21: Inject External Shock if it's a fork
        if ($parentUniverseId && $branchPayload) {
            app(\App\Actions\Simulation\InjectExternalShockAction::class)->execute($universe, $branchPayload);
        }

        // Phase 26: Seed Origin if it's a new root universe
        if (!$parentUniverseId) {
            $this->originSeeder->seed($universe);
        }

        // Phase 62: Axiom Inheritance (§V9)
        if ($parentUniverseId && !empty($branchPayload['inherit_axioms'])) {
            $this->inheritAxioms($parentUniverseId, $universe->id);
        }

        return $universe;
    }

    protected function inheritAxioms(int $parentId, int $childId): void
    {
        $axioms = \App\Models\DiscoveredAxiom::where('universe_id', $parentId)
            ->where('status', 'confirmed')
            ->get();

        foreach ($axioms as $axiom) {
            $new = $axiom->replicate();
            $new->universe_id = $childId;
            $new->tick = 0; // Reset tick for child
            $new->save();
        }
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
