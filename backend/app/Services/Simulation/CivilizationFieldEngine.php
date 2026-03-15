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
        protected WorldWillEngine $willEngine,
        protected CivilizationFieldTheoryEngine $cftEngine
    ) {}

    /**
     * Compute global 10-field vector and write it to the WorldState.
     */
    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $tick): array
    {
        $fields = $this->cftEngine->computeFromState($state, $tick);

        // Standardized state update
        $state->setFields($fields);
        $state->set('civilization_archetype', $this->detectArchetype($fields));

        // Zone propagation
        $zones = $state->get('zones', []);
        if (!empty($zones) && is_array($zones)) {
            $updatedZones = $this->computeZoneFields($zones, $fields);
            $state->set('zone_fields', $updatedZones);
        }

        return $fields;
    }

    /**
     * Propagate global fields into each zone with local modifiers and diffusion.
     */
    protected function computeZoneFields(array $zones, array $globalFields): array
    {
        $result = [];
        foreach ($zones as $zoneId => $zone) {
            $zoneState = $zone['state'] ?? $zone;
            $localFood    = (float) ($zoneState['food'] ?? $zoneState['resources'] ?? 0.5);
            $localOrder   = (float) ($zoneState['order'] ?? $zoneState['stability'] ?? 0.5);
            $localEntropy = (float) ($zoneState['entropy'] ?? 0.3);

            // Diffusion: 70% Global, 30% Local
            $result[$zoneId] = [
                'survival'  => $this->clamp($globalFields['survival'] * (0.7 + $localFood * 0.3)),
                'power'     => $this->clamp($globalFields['power'] * (0.7 + $localOrder * 0.3)),
                'wealth'    => $this->clamp($globalFields['wealth'] * (0.6 + $localFood * 0.4)),
                'knowledge' => $this->clamp($globalFields['knowledge'] * (1.1 - $localEntropy * 0.3)),
                'meaning'   => $this->clamp($globalFields['meaning']),
                'resonance' => $this->clamp($globalFields['resonance']), 
            ];
        }
        return $result;
    }

    /**
     * Detect civilization archetype using vector distance to Attractors.
     */
    public function detectArchetype(array $fields): string
    {
        $attractors = [
            'agrarian_empire'      => ['survival' => 0.8, 'power' => 0.7, 'order' => 0.7, 'wealth' => 0.4],
            'merchant_republic'    => ['wealth' => 0.9, 'knowledge' => 0.6, 'survival' => 0.5, 'order' => 0.5],
            'scientific_technocracy' => ['knowledge' => 0.9, 'wealth' => 0.7, 'authority' => 0.5, 'fear' => 0.2],
            'theocratic_order'     => ['meaning' => 0.9, 'authority' => 0.8, 'power' => 0.6, 'resonance' => 0.8],
            'authoritarian_distopia' => ['power' => 0.8, 'fear' => 0.8, 'authority' => 0.9, 'entropy' => 0.4],
            'chaotic_fragmentation' => ['entropy' => 0.8, 'fear' => 0.7, 'survival' => 0.3, 'order' => 0.2],
        ];

        $bestMatch = 'undefined';
        $minDistance = 999.0;

        foreach ($attractors as $name => $vector) {
            $dist = 0;
            foreach ($vector as $key => $targetVal) {
                $dist += pow(($fields[$key] ?? 0) - $targetVal, 2);
            }
            $dist = sqrt($dist);

            if ($dist < $minDistance) {
                $minDistance = $dist;
                $bestMatch = $name;
            }
        }

        return $bestMatch;
    }

    protected function clamp(float $value): float
    {
        return max(0.0, min(1.0, round($value, 4)));
    }
}
