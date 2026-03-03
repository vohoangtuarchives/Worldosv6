<?php

namespace App\Modules\Intelligence\Services;

use App\Models\World;
use App\Modules\Intelligence\Entities\Contracts\ActorArchetypeInterface;
use App\Modules\Intelligence\Entities\Archetypes\Warlord;
use App\Modules\Intelligence\Entities\Archetypes\Technocrat;
use App\Modules\Intelligence\Entities\Archetypes\RogueAI;
use App\Modules\Intelligence\Entities\Archetypes\Archmage;
use App\Modules\Intelligence\Entities\Archetypes\VillageElder;
use App\Modules\Intelligence\Entities\Archetypes\TribalLeader;

class ActorRegistry
{
    protected array $archetypes = [];

    public function __construct()
    {
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
