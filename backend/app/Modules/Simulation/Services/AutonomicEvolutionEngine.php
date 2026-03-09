<?php

namespace App\Modules\Simulation\Services;

use App\Contracts\UniverseEvaluatorInterface;
use App\Models\UniverseSnapshot;
use App\Services\Simulation\MetricsExtractor;
use Illuminate\Support\Facades\Log;

/**
 * Autonomic Evolution Engine (AEE): decides universe lifecycle (continue / fork / archive / mutate).
 * Runs after each evaluation tick; uses config thresholds. Mutate is a stub for future injection.
 */
class AutonomicEvolutionEngine implements UniverseEvaluatorInterface
{
    public function __construct(
        protected MetricsExtractor $metrics
    ) {}

    /**
     * Evaluate snapshot and return recommendation (IP-score, fork/continue/archive/mutate, mutation suggestion).
     */
    public function evaluate(UniverseSnapshot $snapshot): array
    {
        $m = $this->metrics->extract($snapshot);
        $entropy = (float) ($m['entropy'] ?? 0.5);
        $stability = (float) ($m['stability_index'] ?? 0.5);
        $complexity = (float) ($m['complexity'] ?? 0);

        $archiveThreshold = (float) config('worldos.autonomic.archive_entropy_threshold', 0.99);
        $forkMin = (float) config('worldos.autonomic.fork_entropy_min', 0.5);
        $stagnationThreshold = (float) config('worldos.autonomic.stagnation_threshold', 0.1);

        $ip_score = $stability * (1 - $entropy * 0.5);
        $novelty = $this->computeNovelty($snapshot);

        $recommendation = 'continue';
        if ($entropy >= $archiveThreshold) {
            $recommendation = 'archive';
        } elseif ($entropy >= $forkMin) {
            $recommendation = 'fork';
        } elseif ($novelty < $stagnationThreshold) {
            $recommendation = 'mutate';
            Log::info("AEE: mutate (stub) suggested for Universe " . ($snapshot->universe_id ?? '?') . " at tick {$snapshot->tick}, novelty={$novelty}");
        }

        $mutation_suggestion = null;
        if ($entropy >= 0.7) {
            $mutation_suggestion = ['suggest_reduce_entropy' => true];
        } elseif ($entropy >= 0.5 && $entropy < 0.6 && $recommendation === 'continue') {
            $mutation_suggestion = ['add_scar' => 'entropy_crisis_scar'];
        }

        return [
            'ip_score' => round($ip_score, 4),
            'recommendation' => $recommendation,
            'mutation_suggestion' => $mutation_suggestion,
            'meta' => [
                'entropy' => $entropy,
                'stability' => $stability,
                'novelty' => $novelty,
                'reason' => "AEE at Tick {$snapshot->tick}: entropy={$entropy}, novelty={$novelty}",
            ],
        ];
    }

    /**
     * Simple novelty from state_vector (distance from "empty" state). Stub: 0.5 when no fields.
     */
    protected function computeNovelty(UniverseSnapshot $snapshot): float
    {
        $vec = (array) ($snapshot->state_vector ?? []);
        $fields = (array) ($vec['fields'] ?? []);
        if (empty($fields)) {
            return 0.5;
        }
        $fieldNames = ['survival', 'power', 'wealth', 'knowledge', 'meaning'];
        $sum = 0.0;
        $n = 0;
        foreach ($fieldNames as $f) {
            $v = (float) ($fields[$f] ?? 0.5);
            $sum += ($v - 0.5) ** 2;
            $n++;
        }
        $distance = $n > 0 ? sqrt($sum / $n) : 0.5;
        return min(1.0, $distance);
    }
}
