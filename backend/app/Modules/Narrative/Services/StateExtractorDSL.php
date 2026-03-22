<?php

namespace App\Modules\Narrative\Services;

use App\Modules\Simulation\Core\Support\RuleEngine;

/**
 * Encapsulates the logic to extract "Narrative Tokens" from raw simulation data.
 * Replaces the old fragmented PerceivedArchiveBuilder.
 */
class StateExtractorDSL
{
    public function __construct(
        protected RuleEngine $ruleEngine
    ) {}

    /**
     * @param array $stateVector Raw state vector
     * @param array $metrics Aggregated simulation metrics
     * @return array Object containing both high-level tokens and detailed causal events.
     */
    public function extractContext(int $universeId, int $tick, array $stateVector, array $metrics = []): array
    {
        $tokens = $this->extract($stateVector, $metrics);
        
        /** @var NarrativeEventRegistry $registry */
        $registry = app(NarrativeEventRegistry::class);
        
        // Extract events for the last few ticks to provide causal context
        $events = $registry->getEventsForContext($universeId, max(0, $tick - 5), $tick);

        return [
            'tokens' => $tokens,
            'events' => $events->toArray(),
            'timestamp' => [
                'universe_id' => $universeId,
                'tick' => $tick
            ]
        ];
    }

    public function extract(array $stateVector, array $metrics = []): array
    {
        $tokens = [];
        $ruleDefinitions = $this->getRuleDefinitions();

        // Resolver uses Laravel's data_get to support dotted notation (e.g., "metrics.social.conflict")
        $resolver = function (string $key) use ($stateVector, $metrics) {
            $context = array_merge($stateVector, ['metrics' => $metrics]);
            return data_get($context, $key);
        };

        foreach ($ruleDefinitions as $token => $rules) {
            if ($this->ruleEngine->evaluate($rules, [], $resolver)) {
                $tokens[] = $token;
            }
        }

        return $tokens;
    }

    /**
     * Defined extraction rules.
     * @todo Move to config/worldos_narrative.php in the future.
     */
    protected function getRuleDefinitions(): array
    {
        return [
            'CONFLICT_LEVEL_CRITICAL' => [
                ['key' => 'metrics.social.status.conflict_index', 'op' => '>', 'value' => 0.8]
            ],
            'TECHNOLOGICAL_GOLDEN_AGE' => [
                ['key' => 'metrics.innovation.tech_rate', 'op' => '>', 'value' => 0.85]
            ],
            'ENVIRONMENTAL_COLLAPSE_IMMINENT' => [
                ['key' => 'metrics.environment.stability', 'op' => '<', 'value' => 0.15]
            ],
            'ECONOMIC_PROSPERITY' => [
                ['key' => 'metrics.economy.growth_rate', 'op' => '>', 'value' => 0.05],
                ['key' => 'metrics.economy.inequality', 'op' => '<', 'value' => 0.4]
            ],
            'RELIGIOUS_FERVOR_RISING' => [
                ['key' => 'metrics.social.religion_influence', 'op' => '>', 'value' => 0.7]
            ]
        ];
    }
}

