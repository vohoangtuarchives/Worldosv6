<?php

namespace App\Modules\Narrative\Actions;

use App\Models\Universe;
use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;

class InjectCrisisAction
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepo
    ) {}

    /**
     * Injects a crisis scenario into the specified universe's state vector by increasing entropy
     * and adding destabilizing materials to existing zones.
     *
     * @param Universe $universe
     * @param float $globalEntropy The global entropy target (e.g., 0.85)
     * @param float $zoneEntropy The zone-level entropy target (e.g., 0.95)
     * @return int Number of zones affected
     */
    public function execute(Universe $universe, float $globalEntropy = 0.85, float $zoneEntropy = 0.95): int
    {
        // Re-fetch or trust passed universe instance, usually best to use the entity/model directly
        $vec = is_string($universe->state_vector) ? json_decode($universe->state_vector, true) : ($universe->state_vector ?? []);
        
        // Inject global metadata
        $vec['entropy'] = $globalEntropy; // Critical threshold
        $vec['scars'] = array_unique(array_merge($vec['scars'] ?? [], ['pre_war_tension']));

        // Inject into ZONES (Crucial for Engine Physics)
        $injectedCount = 0;
        
        // Handle explicit 'zones' structure
        if (isset($vec['zones']) && is_array($vec['zones'])) {
            foreach ($vec['zones'] as $idx => $zone) {
                if (isset($zone['state'])) {
                    $vec['zones'][$idx]['state']['entropy'] = $zoneEntropy;
                    // Inject Material: "Unstable Reactor"
                    $vec['zones'][$idx]['state']['active_materials'] = [
                        [
                            'slug' => 'unstable_reactor',
                            'output' => 1.0,
                            'pressure_coefficients' => [
                                'entropy' => 0.1, // Adds 0.1 entropy per tick (scaled by 0.01 in engine -> 0.001)
                                'innovation' => 0.5,
                            ]
                        ]
                    ];
                    $injectedCount++;
                }
            }
        } 
        // Handle flat array structure (numeric keys)
        else {
            foreach ($vec as $key => $val) {
                if (is_int($key) && is_array($val) && isset($val['state'])) {
                    $vec[$key]['state']['entropy'] = $zoneEntropy;
                    // Inject Material: "Unstable Reactor"
                    $vec[$key]['state']['active_materials'] = [
                        [
                            'slug' => 'unstable_reactor',
                            'output' => 1.0,
                            'pressure_coefficients' => [
                                'entropy' => 0.1,
                                'innovation' => 0.5,
                            ]
                        ]
                    ];
                    $injectedCount++;
                }
            }
        }
        
        $universe->state_vector = $vec;
        
        // Persist via repository
        $this->universeRepo->save($universe);

        return $injectedCount;
    }
}

