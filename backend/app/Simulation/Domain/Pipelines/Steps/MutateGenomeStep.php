<?php

namespace App\Simulation\Domain\Pipelines\Steps;

// use App\Simulation\Domain\Pipelines\SpawnStepInterface;
use App\Services\Simulation\KernelMutationService;

/**
 * Bước đột biến genome cho vũ trụ mới.
 */
class MutateGenomeStep implements SpawnStepInterface
{
    public function __construct(
        protected KernelMutationService $mutationService
    ) {}

    public function execute(array $context): array
    {
        $parentGenome = $context['parent_genome'] ?? [];
        $parentUniverseId = $context['parent_universe_id'];

        if ($parentUniverseId) {
            $parent = \App\Models\Universe::find($parentUniverseId);
            $context['genome'] = $this->mutationService->mutate($parentGenome, $parent);
        }

        return $context;
    }
}
