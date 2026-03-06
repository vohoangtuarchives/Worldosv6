<?php

namespace App\Services\Simulation;

use App\Models\BranchEvent;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Repositories\UniverseRepository;
use App\Simulation\Support\RuleEngine;
use App\Simulation\Support\SimulationRandom;
use App\Services\Narrative\EventTriggerMapper;
use Illuminate\Support\Facades\DB;

/**
 * Data-driven event trigger processing: evaluates threshold_rules, cooldown, probability,
 * creates BranchEvent and updates event_cooldowns in state_vector.
 * Fork execution remains with DecideUniverseAction; this only creates the BranchEvent record.
 */
final class EventTriggerProcessor
{
    public function __construct(
        protected EventTriggerMapper $eventTriggerMapper,
        protected RuleEngine $ruleEngine,
        protected UniverseRepository $universeRepository
    ) {}

    public function process(Universe $universe, UniverseSnapshot $snapshot, SimulationRandom $rng): void
    {
        $stateVector = array_merge(
            $snapshot->state_vector ?? [],
            $universe->state_vector ?? []
        );
        $currentTick = (int) $snapshot->tick;

        $rows = DB::table('event_triggers')
            ->whereNotNull('threshold_rules')
            ->get();

        $getValue = fn (string $key) => $this->eventTriggerMapper->getMetricValue($stateVector, $key);
        $cooldowns = $stateVector['event_cooldowns'] ?? [];
        if (!is_array($cooldowns)) {
            $cooldowns = [];
        }
        $updatedCooldowns = false;

        foreach ($rows as $row) {
            $rules = $row->threshold_rules;
            if (is_string($rules)) {
                $rules = json_decode($rules, true);
            }
            if (!is_array($rules) || empty($rules)) {
                continue;
            }

            if (!$this->ruleEngine->evaluate($rules, $stateVector, $getValue)) {
                continue;
            }

            $eventType = $row->event_type;
            $cooldownTicks = (int) ($row->cooldown_ticks ?? 10);
            $lastFired = isset($cooldowns[$eventType]) ? (int) $cooldowns[$eventType] : 0;
            if ($currentTick - $lastFired < $cooldownTicks) {
                continue;
            }

            $probability = (float) ($row->probability ?? 0.2);
            $effectiveProbability = $this->effectiveProbability($eventType, $probability, $stateVector);
            if ($rng->float(0, 1) > $effectiveProbability) {
                continue;
            }

            BranchEvent::create([
                'universe_id' => $universe->id,
                'from_tick' => $currentTick,
                'event_type' => $eventType,
                'payload' => [
                    'trigger_id' => $row->id,
                    'context' => [
                        'entropy' => $stateVector['entropy'] ?? null,
                        'stability_index' => $stateVector['stability_index'] ?? null,
                    ],
                ],
            ]);

            $cooldowns[$eventType] = $currentTick;
            $updatedCooldowns = true;
        }

        if ($updatedCooldowns) {
            $vec = $universe->state_vector ?? [];
            if (!is_array($vec)) {
                $vec = [];
            }
            $vec['event_cooldowns'] = $cooldowns;
            $this->universeRepository->update($universe->id, ['state_vector' => $vec]);
        }
    }

    /**
     * Apply attractor force_map modulation when active_attractors present (Giai đoạn 2).
     */
    private function effectiveProbability(string $eventType, float $baseProbability, array $stateVector): float
    {
        $active = $stateVector['active_attractors'] ?? [];
        if (!is_array($active) || empty($active)) {
            return min(1.0, $baseProbability);
        }
        $modifier = 0.0;
        foreach ($active as $attractor) {
            $forceMap = $attractor['force_map'] ?? [];
            if (!is_array($forceMap) || !isset($forceMap[$eventType])) {
                continue;
            }
            $strength = (float) ($attractor['strength'] ?? 1.0);
            $modifier += $strength * (float) $forceMap[$eventType];
        }
        return min(1.0, $baseProbability * (1 + $modifier));
    }
}
