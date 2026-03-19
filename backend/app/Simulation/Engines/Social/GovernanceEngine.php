<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;

/**
 * Phase 76+ Vector 2: GovernanceEngine — Restored full event emission.
 *
 * "Khi chính nghĩa sụp đổ, lửa cách mạng bùng cháy."
 * Emits REVOLUTION, COALITION, GOVERNANCE_CRISIS events via WorldEventBus.
 */
final class GovernanceEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    public function phase(): string { return 'politics'; }
    public function name(): string { return 'governance'; }
    public function priority(): int { return 17; }
    public function tickRate(): int { return 1; }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        // Run DSL for base governance logic
        $this->ruleVm->evaluateAndApplyWithState($state, 'society/dynamics', $ctx->getTick());

        $vec = $state->getStateVector();
        $legitimacy = (float) ($vec['legitimacy'] ?? 0.5);
        $inequality = (float) ($vec['inequality'] ?? 0.2);
        $stability  = (float) ($state->get('stability_index', 0.5));
        $corruption = (float) ($vec['corruption'] ?? 0.1);

        $events  = [];
        $effects = [];

        // ── Vector 2a: Revolution Trigger ──
        // Khi chính quyền mất chính nghĩa và bất bình đẳng cao → cách mạng
        if ($legitimacy < 0.2 && $inequality > 0.8) {
            $events[] = WorldEvent::create(
                WorldEventType::STABILITY_CRISIS,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.9,
                [],
                [
                    'subtype'    => 'REVOLUTION',
                    'legitimacy' => $legitimacy,
                    'inequality' => $inequality,
                    'message'    => 'Ngọn lửa cách mạng bùng phát — chính nghĩa đã sụp đổ hoàn toàn.',
                ]
            );
            // Revolution destabilizes but can reset inequality
            $effects[] = new WorldRulesUpdateEffect([
                'stability'  => max(0.0, $stability - 0.15),
                'inequality' => max(0.1, $inequality - 0.3),
                'legitimacy' => min(1.0, $legitimacy + 0.1), // new order begins
            ]);
        }

        // ── Vector 2b: Governance Crisis (softer) ──
        elseif ($legitimacy < 0.35 && $corruption > 0.7) {
            $events[] = WorldEvent::create(
                WorldEventType::STABILITY_CRISIS,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.65,
                [],
                [
                    'subtype'    => 'GOVERNANCE_CRISIS',
                    'legitimacy' => $legitimacy,
                    'corruption' => $corruption,
                    'message'    => 'Hệ thống quản trị rơi vào khủng hoảng — tham nhũng tràn lan.',
                ]
            );
        }

        // ── Vector 2c: Coalition Formation ──
        // Khi stability thấp nhưng legitimacy vẫn còn → các faction liên minh để bảo vệ trật tự
        if ($stability < 0.3 && $legitimacy > 0.5) {
            $state->set('meta.coalition_forming', true);
            $state->set('meta.coalition_strength', $legitimacy * 0.8);

            $events[] = WorldEvent::create(
                WorldEventType::POLITICAL_SHIFT,
                $ctx->getUniverseId(),
                $ctx->getTick(),
                null,
                [],
                0.5,
                [],
                [
                    'subtype'          => 'COALITION_FORMATION',
                    'coalition_strength' => round($legitimacy * 0.8, 3),
                    'message'          => 'Các thế lực chính trị liên minh để chống lại sự sụp đổ.',
                ]
            );
        }

        return new EngineResult($events, $effects, []);
    }
}



