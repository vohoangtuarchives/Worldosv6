<?php

namespace App\Simulation\Domain;

/**
 * Immutable read-only view of world state for a simulation tick.
 * Built from snapshot (and universe). Engines read only; changes go via Effect → EffectResolver.
 */
final class WorldState
{
    public function __construct(
        private readonly int $universeId,
        private readonly int $tick,
        private readonly array $metrics,
        private readonly array $stateVector,
    ) {
    }

    public function getUniverseId(): int
    {
        return $this->universeId;
    }

    public function getTick(): int
    {
        return $this->tick;
    }

    public function getMetrics(): array
    {
        return $this->metrics;
    }

    public function getMetric(string $key, mixed $default = null): mixed
    {
        return $this->metrics[$key] ?? $default;
    }

    public function getStateVector(): array
    {
        return $this->stateVector;
    }

    public function getStateVectorKey(string $key, mixed $default = null): mixed
    {
        return $this->stateVector[$key] ?? $default;
    }

    public function getZones(): array
    {
        return $this->stateVector['zones'] ?? [];
    }

    public function getEntropy(): float
    {
        return (float) ($this->stateVector['entropy'] ?? 0);
    }

    public function getInnovation(): float
    {
        return (float) ($this->stateVector['innovation'] ?? 0);
    }

    public function getOrder(): float
    {
        return (float) ($this->stateVector['order'] ?? 0);
    }

    /** @return array<string, float> innovation, entropy, order, myth, conflict, ascension, ascension_pressure, collapse_pressure */
    public function getPressures(): array
    {
        $p = $this->stateVector['pressures'] ?? [];
        return [
            'innovation' => (float) ($p['innovation'] ?? 0),
            'entropy' => (float) ($p['entropy'] ?? 0),
            'order' => (float) ($p['order'] ?? 0),
            'myth' => (float) ($p['myth'] ?? 0),
            'conflict' => (float) ($p['conflict'] ?? 0),
            'ascension' => (float) ($p['ascension'] ?? 0),
            'ascension_pressure' => (float) ($p['ascension_pressure'] ?? 0),
            'collapse_pressure' => (float) ($p['collapse_pressure'] ?? 0),
        ];
    }

    /**
     * Zone-level pressure keys used by Potential Field (default 0 if missing).
     * @return array<string, float> war_pressure, economic_pressure, religious_pressure, migration_pressure, innovation_pressure
     */
    public static function getZonePressures(array $zone): array
    {
        $state = $zone['state'] ?? [];
        return [
            'war_pressure' => (float) ($state['war_pressure'] ?? 0),
            'economic_pressure' => (float) ($state['economic_pressure'] ?? 0),
            'religious_pressure' => (float) ($state['religious_pressure'] ?? 0),
            'migration_pressure' => (float) ($state['migration_pressure'] ?? 0),
            'innovation_pressure' => (float) ($state['innovation_pressure'] ?? 0),
        ];
    }

    /** Default zone pressure keys for initialization. */
    public static function defaultZonePressureKeys(): array
    {
        return [
            'war_pressure' => 0.0,
            'economic_pressure' => 0.0,
            'religious_pressure' => 0.0,
            'migration_pressure' => 0.0,
            'innovation_pressure' => 0.0,
        ];
    }

    /** Population layer: default zone state keys (aggregated population proxy 0..1). */
    public static function defaultZonePopulationKeys(): array
    {
        return [
            'population_proxy' => 0.5,
        ];
    }

    public static function getZonePopulationProxy(array $zone): float
    {
        $state = $zone['state'] ?? [];
        return (float) ($state['population_proxy'] ?? 0.5);
    }
}
