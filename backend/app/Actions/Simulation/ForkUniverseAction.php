<?php

namespace App\Actions\Simulation;

use App\Contracts\Repositories\BranchEventRepositoryInterface;
use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\BranchEvent;
use App\Models\Universe;
use App\Services\Saga\SagaService;
use Illuminate\Support\Collection;

class ForkUniverseAction
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected BranchEventRepositoryInterface $branchRepository,
        protected SagaService $sagaService
    ) {}

    /**
     * Execute universe forking logic. Idempotent per (universe_id, from_tick); at most one fork event per universe as parent.
     * Returns collection of child universes (1 to max_fork_branches).
     */
    public function execute(Universe $universe, int $fromTick, array $decisionData): Collection
    {
        if ($this->branchRepository->existsFork($universe->id, $fromTick)) {
            return collect();
        }
        if ($this->branchRepository->hasForkAsParent($universe->id)) {
            return collect();
        }

        $maxBranches = (int) config('worldos.autonomic.max_fork_branches', 1);
        $maxBranches = max(1, min($maxBranches, 10));

        $entropy = (float) ($universe->entropy ?? ($universe->state_vector['entropy'] ?? 0.5));
        $branchCount = min($maxBranches, max(1, (int) floor($entropy * 4)));

        $payload = [
            'reason' => $decisionData['meta']['reason'] ?? 'high_entropy',
            'mutation' => $decisionData['meta']['mutation_suggestion'] ?? null,
            'score' => $decisionData['meta']['ip_score'] ?? 0,
        ];

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $fromTick,
            'event_type' => 'fork',
            'payload' => array_merge($payload, ['branch_count' => $branchCount]),
        ]);

        $children = collect();
        for ($i = 0; $i < $branchCount; $i++) {
            $branchPayload = array_merge($payload, ['branch_index' => $i]);
            $child = $this->sagaService->spawnUniverse(
                $universe->world,
                $universe->id,
                $universe->saga_id,
                $branchPayload
            );
            $children->push($child);
        }

        $vec = $universe->state_vector ?? [];
        $vec['entropy'] = 0.5;
        $this->universeRepository->update($universe->id, ['state_vector' => $vec]);

        return $children;
    }
}
