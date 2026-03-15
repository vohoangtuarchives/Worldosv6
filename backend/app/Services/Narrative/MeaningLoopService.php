<?php

namespace App\Services\Narrative;

use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use Illuminate\Support\Facades\Log;

/**
 * V10+ Vector 5: Meaning Loop Closure Service 🧘‍♂️⚡
 *
 * "Niềm tin không chỉ là ý tưởng — nó là lực lượng định hình hành động."
 *
 * Thực hiện vòng lặp từ Belief → Action:
 *  1. Belief → Actor action weight modifier (stored in WorldState)
 *  2. Schism event khi meaning system coherence sụp đổ
 *  3. Martyr effect khi heroic actor hi sinh trong xung đột tôn giáo
 */
class MeaningLoopService
{
    private const SCHISM_COHERENCE_THRESHOLD = 0.3;
    private const MARTYR_INFLUENCE_BOOST = 0.25;

    /**
     * Run all meaning loop mechanics.
     * Called from MetaCosmicStage each tick.
     */
    public function runWithState(WorldState $state, int $tick): array
    {
        $events = [];

        // 1. Compute belief modifiers for actor decisions
        $this->computeBeliefModifiers($state);

        // 2. Check for schisms
        $schismEvents = $this->processSchisms($state, $tick);
        $events = array_merge($events, $schismEvents);

        // 3. Process martyrdom
        $martyrEvents = $this->processMartyrdom($state, $tick);
        $events = array_merge($events, $martyrEvents);

        return $events;
    }

    /**
     * Vector 5a: Compute belief → action modifiers.
     * Stored as meta.belief_action_modifiers in WorldState for ActorDecisionEngine to read.
     *
     * Example: theocratic religion → +30% govern, -20% explore
     */
    private function computeBeliefModifiers(WorldState $state): void
    {
        $meaningSystems = (array) $state->get('meta.meaning_systems', []);
        $modifiers = [];

        foreach ($meaningSystems as $system) {
            $type       = $system['type']      ?? 'UNKNOWN';
            $influence  = (float) ($system['influence']  ?? 0.0);
            $coherence  = (float) ($system['coherence']  ?? 0.0);
            $weight     = $influence * $coherence; // Only coherent + influential systems matter

            // Type-specific modifiers
            $delta = match($type) {
                'RELIGION'  => [
                    'govern'          => +0.3 * $weight,
                    'meditate'        => +0.4 * $weight,
                    'explore'         => -0.2 * $weight,
                    'create_religion' => -0.1 * $weight, // Already religious → less likely to create new one
                ],
                'IDEOLOGY' => [
                    'govern'  => +0.2 * $weight,
                    'build'   => +0.15 * $weight,
                    'trade'   => +0.1 * $weight,
                    'war'     => $state->get('meta.ideology_martial', false) ? +0.2 * $weight : -0.1 * $weight,
                ],
                default => [],
            };

            // Accumulate modifiers
            foreach ($delta as $action => $mod) {
                $modifiers[$action] = ($modifiers[$action] ?? 0.0) + $mod;
            }
        }

        $state->set('meta.belief_action_modifiers', $modifiers);
    }

    /**
     * Vector 5b: Schism detection — split meaning systems with low coherence.
     */
    private function processSchisms(WorldState $state, int $tick): array
    {
        $meaningSystems = (array) $state->get('meta.meaning_systems', []);
        $events = [];
        $updated = [];

        foreach ($meaningSystems as $system) {
            $coherence = (float) ($system['coherence'] ?? 1.0);
            $type      = $system['type'] ?? 'UNKNOWN';
            $id        = $system['id'] ?? 'unknown';

            if ($coherence < self::SCHISM_COHERENCE_THRESHOLD) {
                // Create two splinter factions
                $orthodox = array_merge($system, [
                    'id'        => $id . '_orthodox',
                    'influence' => $system['influence'] * 0.6,
                    'coherence' => 0.7,
                ]);
                $reformist = array_merge($system, [
                    'id'        => $id . '_reformist',
                    'influence' => $system['influence'] * 0.5,
                    'coherence' => 0.6,
                ]);

                $updated[] = $orthodox;
                $updated[] = $reformist;

                $events[] = WorldEvent::create(
                    WorldEventType::RELIGIOUS_CONFLICT,
                    (int) $state->get('universe_id'),
                    $tick,
                    null,
                    [],
                    0.7,
                    [],
                    [
                        'subtype'        => 'SCHISM',
                        'original_system' => $id,
                        'type'           => $type,
                        'message'        => "Hệ thống {$type} [{$id}] phân nhánh — giáo hội cũ sụp đổ thành hai phái đối lập.",
                    ]
                );

                Log::info("MeaningLoopService: Schism triggered for system {$id}", ['tick' => $tick]);
            } else {
                $updated[] = $system;
            }
        }

        $state->set('meta.meaning_systems', $updated);
        return $events;
    }

    /**
     * Vector 5c: Martyr effect — heroic actor death in religious conflict boosts influence.
     */
    private function processMartyrdom(WorldState $state, int $tick): array
    {
        $martyrQueue = (array) $state->get('meta.martyr_queue', []);
        if (empty($martyrQueue)) {
            return [];
        }

        $events = [];
        $meaningSystems = (array) $state->get('meta.meaning_systems', []);

        foreach ($martyrQueue as $martyr) {
            $religionId = $martyr['religion_id'] ?? null;
            if (!$religionId) continue;

            // Boost the target religion's influence
            foreach ($meaningSystems as &$system) {
                $sysId = $system['db_id'] ?? null;
                if ($sysId && $sysId == $religionId) {
                    $system['influence'] = min(1.0, $system['influence'] + self::MARTYR_INFLUENCE_BOOST);
                    $system['coherence'] = min(1.0, $system['coherence'] + 0.1);
                }
            }

            $events[] = WorldEvent::create(
                WorldEventType::RELIGIOUS_CONFLICT,
                (int) $state->get('universe_id'),
                $tick,
                null,
                [],
                0.85,
                [],
                [
                    'subtype'  => 'MARTYRDOM',
                    'actor_id' => $martyr['actor_id'] ?? null,
                    'religion_id' => $religionId,
                    'message'  => "Vị thánh tử đạo đã hi sinh — niềm tin của cộng đồng bùng cháy mạnh mẽ hơn bao giờ.",
                ]
            );
        }

        $state->set('meta.meaning_systems', $meaningSystems);
        $state->set('meta.martyr_queue', []); // Clear queue

        return $events;
    }
}
