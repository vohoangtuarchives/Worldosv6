<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Repositories\UniverseRepository;
use App\Simulation\Support\RuleEngine;
use App\Services\Narrative\EventTriggerMapper;
use Illuminate\Support\Facades\DB;

/**
 * Evaluates civilization attractors from activation_rules; writes active_attractors to state_vector.
 * EventTriggerProcessor uses active_attractors to modulate event probabilities via force_map.
 */
final class AttractorEngine
{
    public function __construct(
        protected RuleEngine $ruleEngine,
        protected EventTriggerMapper $eventTriggerMapper,
        protected UniverseRepository $universeRepository
    ) {}

    /**
     * Evaluate which attractors are active for this universe/snapshot; persist to universe.state_vector.
     */
    public function evaluate(Universe $universe, UniverseSnapshot $snapshot): array
    {
        $stateVector = array_merge(
            $snapshot->state_vector ?? [],
            $universe->state_vector ?? []
        );

        $rows = DB::table('civilization_attractors')->get();
        $getValue = fn (string $key) => $this->eventTriggerMapper->getMetricValue($stateVector, $key);
        $active = [];

        foreach ($rows as $row) {
            $rules = $row->activation_rules;
            if (is_string($rules)) {
                $rules = json_decode($rules, true);
            }
            if (!is_array($rules) || empty($rules)) {
                continue;
            }
            if (!$this->ruleEngine->evaluate($rules, $stateVector, $getValue)) {
                continue;
            }
            $forceMap = $row->force_map;
            if (is_string($forceMap)) {
                $forceMap = json_decode($forceMap, true);
            }
            $active[] = [
                'type' => $row->name,
                'strength' => 1.0,
                'force_map' => is_array($forceMap) ? $forceMap : [],
            ];
        }

        if (!empty($active)) {
            $vec = $universe->state_vector ?? [];
            if (!is_array($vec)) {
                $vec = [];
            }
            $vec['active_attractors'] = $active;
            $this->universeRepository->update($universe->id, ['state_vector' => $vec]);
        }

        return $active;
    }
}
