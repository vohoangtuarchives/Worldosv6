<?php

namespace App\Simulation\Domain;

/**
 * Immutable read-only view of world state for a simulation tick (doc §5).
 * Built from snapshot (and universe). Engines read only; changes go via Effect → EffectResolver.
 *
 * state_vector key convention (World State root): planet, civilizations, population,
 * economy, knowledge, culture, active_attractors, wars. Snapshot JSON may store these
 * blocks for engines to read via getPlanet(), getCivilizations(), etc.
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

    /** World State root (doc §5): planet layer. */
    public function getPlanet(): array
    {
        $v = $this->stateVector['planet'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: civilizations layer. */
    public function getCivilizations(): array
    {
        $v = $this->stateVector['civilizations'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: population layer. */
    public function getPopulation(): array
    {
        $v = $this->stateVector['population'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: economy layer. */
    public function getEconomy(): array
    {
        $v = $this->stateVector['economy'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: knowledge layer. */
    public function getKnowledge(): array
    {
        $v = $this->stateVector['knowledge'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: culture layer. */
    public function getCulture(): array
    {
        $v = $this->stateVector['culture'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: active attractors. */
    public function getActiveAttractors(): array
    {
        $v = $this->stateVector['active_attractors'] ?? null;
        return is_array($v) ? $v : [];
    }

    /** World State root: wars / conflicts. */
    public function getWars(): array
    {
        $v = $this->stateVector['wars'] ?? null;
        return is_array($v) ? $v : [];
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
