<?php

namespace App\Simulation\Engines\Social;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\DiplomaticTreaty;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Domain\TickContext;
use App\Simulation\Domain\EngineResult;
use Illuminate\Support\Facades\Log;

/**
 * Diplomacy Engine (Layer 7).
 * Logic:
 * - Load treaties từ DB or State
 * - Check expiration (ends_at_tick)
 * - Evaluate tension giữa các phe (tương tự DiplomaticEngine cũ)
 */
class DiplomacyEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function name(): string { return 'diplomacy'; }
    public function priority(): int { return 12; } // Runs after Politics & War
    public function tickRate(): int { return (int) config('worldos.tick_pipeline.social.interval', 15); }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        return $this->runWithState($state, $ctx->getTick());
    }

    public function runWithState(WorldState $state, int $currentTick): EngineResult
    {
        $interval = (int) config('worldos.intelligence.diplomacy_tick_interval', 30);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return EngineResult::empty();
        }

        $events = [];
        $effects = [];
        $universeId = $state->get('universe_id');

        // 1. Process Active Treaties
        $expiringTreaties = DiplomaticTreaty::where('universe_id', $universeId)
            ->where('is_active', true)
            ->whereNotNull('ends_at_tick')
            ->where('ends_at_tick', '<=', $currentTick)
            ->get();

        foreach ($expiringTreaties as $treaty) {
            $treaty->update(['is_active' => false]);
            $events[] = [
                'type' => 'TREATY_EXPIRED',
                'source_civ_id' => $treaty->source_civ_id,
                'target_civ_id' => $treaty->target_civ_id,
                'treaty_type' => $treaty->treaty_type,
            ];
        }

        // 2. Load active treaties into state vector for other engines to read
        $activeTreaties = DiplomaticTreaty::where('universe_id', $universeId)
            ->where('is_active', true)
            ->get();

        $diplomacyMap = [];
        foreach ($activeTreaties as $treaty) {
            $diplomacyMap[$treaty->source_civ_id][$treaty->target_civ_id][] = $treaty->treaty_type;
            // Mirror relationship for easy access
            $diplomacyMap[$treaty->target_civ_id][$treaty->source_civ_id][] = $treaty->treaty_type;
        }

        // 3. Faction Tension Computation (inspired by older DiplomaticEngine)
        $factions = $state->get('factions', []);
        $tensions = [];
        $entropy = (float)$state->get('entropy', 0.5);

        if (count($factions) >= 2) {
            for ($i = 0; $i < count($factions); $i++) {
                for ($j = $i + 1; $j < count($factions); $j++) {
                    $fA = $factions[$i];
                    $fB = $factions[$j];
                    
                    $idA = $fA['id'];
                    $idB = $fB['id'];
                    $key = "{$idA}_{$idB}"; // normalize to smaller first if needed, just doing A_B for now
                    if ($idB < $idA) {
                        $key = "{$idB}_{$idA}";
                    }

                    // Check if they have an active alliance/NAP
                    $hasAlliance = false;
                    if (isset($diplomacyMap[$idA][$idB])) {
                        if (in_array('ALLIANCE', $diplomacyMap[$idA][$idB])) $hasAlliance = true;
                        if (in_array('NON_AGGRESSION', $diplomacyMap[$idA][$idB])) $hasAlliance = true;
                    }

                    $dist = $this->calculateIdeologyDistance(
                        $fA['ideology_vector'] ?? [0.5, 0.5, 0.5],
                        $fB['ideology_vector'] ?? [0.5, 0.5, 0.5]
                    );

                    $targetTension = $dist * (1.0 + $entropy);
                    if ($hasAlliance) {
                        $targetTension *= 0.2; // Alliance greatly reduces tension build-up
                    }

                    $tensions[$key] = [
                        'tension' => min(1.0, max(0.0, $targetTension)),
                        'has_alliance' => $hasAlliance
                    ];
                }
            }
        }

        // Save to state vector
        $effects[] = [
            'type' => 'MERGE_STATE',
            'path' => 'civilization.diplomacy',
            'value' => [
                'active_treaties' => $diplomacyMap,
                'tensions' => $tensions,
                'last_updated' => $currentTick
            ]
        ];

        return new EngineResult($events, $effects);
    }

    protected function calculateIdeologyDistance(array $v1, array $v2): float
    {
        $sum = 0;
        foreach ($v1 as $i => $val) {
            $sum += pow($val - ($v2[$i] ?? 0.5), 2);
        }
        return sqrt($sum);
    }
}
