<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\World;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Domain\Simulation\Actors\Archetypes\VillageElder;
use App\Domain\Simulation\Actors\Archetypes\TribalLeader;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TraitSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_village_elder_eligibility()
    {
        $elder = new VillageElder();
        
        $vietnameseWorld = new World();
        $vietnameseWorld->evolution_genome = ['origin_heritage' => 'Vietnamese'];
        
        $spiritualWorld = new World();
        $spiritualWorld->evolution_genome = ['spirituality' => 0.8];
        
        $normalWorld = new World();
        $normalWorld->evolution_genome = ['origin_heritage' => 'Western', 'spirituality' => 0.1];

        $this->assertTrue($elder->isEligible($vietnameseWorld));
        $this->assertTrue($elder->isEligible($spiritualWorld));
        $this->assertFalse($elder->isEligible($normalWorld));
    }

    public function test_tribal_leader_utility()
    {
        $leader = new TribalLeader();
        
        // Tribal Leader mạnh nhất khi stability thấp
        $lowStabilityUtility = $leader->getBaseUtility(0.1);
        $highStabilityUtility = $leader->getBaseUtility(0.9);
        
        $this->assertGreaterThan($highStabilityUtility, $lowStabilityUtility);
    }

    public function test_warlord_utility()
    {
        $warlord = new \App\Domain\Simulation\Actors\Archetypes\Warlord();
        
        // Warlord cực kỳ mạnh khi ổn định thấp (1.6 - stability)
        $this->assertEqualsWithDelta(1.5, $warlord->getBaseUtility(0.1), 0.001);
        $this->assertEqualsWithDelta(0.7, $warlord->getBaseUtility(0.9), 0.001);
    }
}
