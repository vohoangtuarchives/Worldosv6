<?php

namespace App\Simulation\Domain\Pipelines\Steps;

// use App\Simulation\Domain\Pipelines\SpawnStepInterface;

/**
 * Bước kế thừa các Axiom đã khám phá từ vũ trụ cha.
 */
class InheritAxiomsStep implements SpawnStepInterface
{
    public function execute(array $context): array
    {
        $parentUniverseId = $context['parent_universe_id'];
        $universe = $context['universe'];
        $branchPayload = $context['branch_payload'];

        if ($parentUniverseId && $universe && !empty($branchPayload['inherit_axioms'])) {
            $axioms = \App\Models\DiscoveredAxiom::where('universe_id', $parentUniverseId)
                ->where('status', 'confirmed')
                ->get();

            foreach ($axioms as $axiom) {
                $new = $axiom->replicate();
                $new->universe_id = $universe->id;
                $new->tick = 0; // Reset tick cho universe mới
                $new->save();
            }
        }

        return $context;
    }
}
