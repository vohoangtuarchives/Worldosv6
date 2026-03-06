<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\InstitutionalEntity;
use Illuminate\Support\Facades\DB;

/**
 * CivilizationFieldEngine – computes the 5 Attractor Field vector each tick.
 *
 * The 5 fields are the core fields of civilization emergence:
 *   survival  → resource density, population pressure
 *   power     → institutional_power, military capacity, hierarchy
 *   wealth    → trade volume, production, market activity
 *   knowledge → curiosity traits, tech level, education institutions
 *   meaning   → spirituality, identity, cultural cohesion
 *
 * Fields are stored in state_vector['fields'] = [ survival: float, power: float, ... ]
 * and in state_vector['zones'][i]['fields'] for per-zone resolution (if zones exist).
 */
class CivilizationFieldEngine
{
    public function __construct(
        protected WorldWillEngine $willEngine
    ) {}

    /**
     * Compute global 5-field vector and write it to the universe state_vector.
     * Returns the computed fields array.
     */
    public function computeAndStore(Universe $universe, UniverseSnapshot $snapshot): array
    {
        $vec     = (array) ($snapshot->state_vector ?? []);
        $metrics = (array) ($snapshot->metrics ?? []);
        $state   = array_merge($vec, $metrics);

        $fields = $this->computeGlobalFields($universe, $state);

        // Write back to universe state_vector
        $uvec = (array) ($universe->state_vector ?? []);
        $uvec['fields'] = $fields;
        $universe->state_vector = $uvec;
        $universe->save();

        // Per-zone fields if zones exist
        if (!empty($vec['zones']) && is_array($vec['zones'])) {
            $updatedZones = $this->computeZoneFields($vec['zones'], $fields);
            $uvec['zone_fields'] = $updatedZones;
            $universe->state_vector = $uvec;
            $universe->save();
        }

        return $fields;
    }

    /**
     * Compute the 5 global field values from simulation state + actor alignment.
     */
    public function computeGlobalFields(Universe $universe, array $state): array
    {
        // 1. Get WorldWillEngine alignment (spirit / hardtech / entropy)
        $alignment = $this->willEngine->calculateAlignment($universe);
        $spirituality = $alignment['spirituality'] ?? 0.33;
        $hardtech     = $alignment['hardtech'] ?? 0.33;
        $entropy      = $alignment['entropy'] ?? 0.34;

        // 2. Derive fields from state + alignment
        $resourceDensity    = $this->avg($state, ['resource_density', 'avg_resources', 'food_supply'], 0.5);
        $populationPressure = $this->clamp(($state['population_density'] ?? 0.5) * 0.8);
        $stabilityIndex     = (float) ($state['stability_index'] ?? $state['sci'] ?? 0.5);
        $techLevel          = (float) ($state['technology_level'] ?? $state['tech'] ?? 0.3);
        $tradeActivity      = (float) ($state['trade_activity'] ?? $state['trade'] ?? 0.3);
        $institutionalPower = $this->computeInstitutionalPower($universe);

        $fields = [
            // Survival: driven by resources and population pressure
            'survival'  => $this->clamp(
                $resourceDensity * 0.5
                + $populationPressure * 0.3
                + (1.0 - $entropy) * 0.2
            ),

            // Power: driven by institutions, stability, hierarchy
            'power'     => $this->clamp(
                $institutionalPower * 0.5
                + $stabilityIndex * 0.3
                + $hardtech * 0.2
            ),

            // Wealth: driven by trade, tech, production
            'wealth'    => $this->clamp(
                $tradeActivity * 0.4
                + $techLevel * 0.3
                + $resourceDensity * 0.3
            ),

            // Knowledge: driven by hardtech alignment + curiosity traits
            'knowledge' => $this->clamp(
                $hardtech * 0.5
                + $techLevel * 0.3
                + $stabilityIndex * 0.2
            ),

            // Meaning: driven by spirituality alignment + cultural coherence
            'meaning'   => $this->clamp(
                $spirituality * 0.6
                + (float) ($state['cultural_coherence'] ?? 0.5) * 0.4
            ),
        ];

        return $fields;
    }

    /**
     * Propagate global fields into each zone with local modifiers.
     * Zone-level field = global_field × local_resource_ratio.
     */
    protected function computeZoneFields(array $zones, array $globalFields): array
    {
        $result = [];
        foreach ($zones as $zoneId => $zone) {
            $zoneState = $zone['state'] ?? $zone;
            $localFood    = (float) ($zoneState['food'] ?? $zoneState['resources'] ?? 0.5);
            $localOrder   = (float) ($zoneState['order'] ?? $zoneState['stability'] ?? 0.5);
            $localEntropy = (float) ($zoneState['entropy'] ?? 0.3);

            $result[$zoneId] = [
                'survival'  => $this->clamp($globalFields['survival'] * (0.6 + $localFood * 0.4)),
                'power'     => $this->clamp($globalFields['power'] * (0.6 + $localOrder * 0.4)),
                'wealth'    => $this->clamp($globalFields['wealth'] * (0.5 + $localFood * 0.5)),
                'knowledge' => $this->clamp($globalFields['knowledge'] * (1.0 - $localEntropy * 0.3)),
                'meaning'   => $this->clamp($globalFields['meaning']),
            ];
        }
        return $result;
    }

    /**
     * Detect civilization archetype from field vector.
     * Used by WorldAdvisorService for Autonomous Civilization Discovery.
     */
    public function detectArchetype(array $fields): string
    {
        $max = max($fields);
        $dominant = array_search($max, $fields);

        $pairs = [
            'power+survival' => ($fields['power'] > 0.6 && $fields['survival'] > 0.6) ? 'agrarian_empire' : null,
            'wealth'         => ($fields['wealth'] > 0.65) ? 'merchant_republic' : null,
            'knowledge'      => ($fields['knowledge'] > 0.65) ? 'scientific_civilization' : null,
            'meaning+power'  => ($fields['meaning'] > 0.65 && $fields['power'] > 0.55) ? 'theocracy' : null,
        ];

        foreach ($pairs as $archetype) {
            if ($archetype !== null) return $archetype;
        }

        return match ($dominant) {
            'survival'  => 'tribal_confederation',
            'power'     => 'authoritarian_state',
            'wealth'    => 'trade_league',
            'knowledge' => 'academy_network',
            'meaning'   => 'religious_order',
            default     => 'undefined',
        };
    }

    protected function computeInstitutionalPower(Universe $universe): float
    {
        $count = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->count();

        $avgOrg = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->avg('org_capacity') ?? 0.0;

        // Normalize: 10 institutions = 1.0 power baseline
        return $this->clamp(($count / 10.0) * 0.4 + (float) $avgOrg * 0.6);
    }

    protected function avg(array $state, array $keys, float $default): float
    {
        $values = array_filter(
            array_map(fn($k) => $state[$k] ?? null, $keys),
            fn($v) => $v !== null
        );
        return !empty($values) ? (float) (array_sum($values) / count($values)) : $default;
    }

    protected function clamp(float $value): float
    {
        return max(0.0, min(1.0, round($value, 4)));
    }
}
