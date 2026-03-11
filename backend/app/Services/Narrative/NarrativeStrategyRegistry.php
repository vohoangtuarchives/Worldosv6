<?php

namespace App\Services\Narrative;

use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

/**
 * Resolves strategy by action. Register specific strategies first, LegacyNarrativeStrategy last.
 */
class NarrativeStrategyRegistry
{
    /** @var array<int, NarrativeStrategyInterface> */
    private array $strategies = [];

    public function register(NarrativeStrategyInterface $strategy): self
    {
        $this->strategies[] = $strategy;
        return $this;
    }

    public function resolve(string $action): NarrativeStrategyInterface
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($action)) {
                return $strategy;
            }
        }
        throw new \RuntimeException("No narrative strategy for action: {$action}. Register LegacyNarrativeStrategy as fallback.");
    }

    public function supports(string $action): bool
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($action)) {
                return true;
            }
        }
        return false;
    }
}
