<?php

namespace App\Domain\Simulation\Actors;

use App\Models\World;
use App\Domain\Simulation\Actors\Archetypes\Warlord;
use App\Domain\Simulation\Actors\Archetypes\Technocrat;
use App\Domain\Simulation\Actors\Archetypes\RogueAI;
use App\Domain\Simulation\Actors\Archetypes\Archmage;
use App\Domain\Simulation\Actors\Archetypes\VillageElder;
use App\Domain\Simulation\Actors\Archetypes\TribalLeader;

class ActorRegistry
{
    protected array $archetypes = [];

    public function __construct()
    {
        // Register all available archetypes
        // Link with ApplyMythScarAction via app() helper
        $this->archetypes = [
            app(Warlord::class),
            app(Technocrat::class),
            app(RogueAI::class),
            app(Archmage::class),
            app(VillageElder::class),
            app(TribalLeader::class),
        ];
    }

    /**
     * Lọc danh sách archetypes phù hợp với thế giới hiện tại.
     */
    public function getEligibleArchetypes(World $world): array
    {
        return array_filter($this->archetypes, fn(ActorArchetypeInterface $a) => $a->isEligible($world));
    }
}
