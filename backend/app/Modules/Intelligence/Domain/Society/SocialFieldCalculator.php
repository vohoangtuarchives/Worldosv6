<?php

namespace App\Modules\Intelligence\Domain\Society;

use App\Modules\Intelligence\Entities\ActorState;

class SocialFieldCalculator
{
    /**
     * Calculates the mean-field aggregation of population traits. O(n).
     * 
     * @param array<ActorState> $actors
     * @return SocialField
     */
    public function calculate(array $actors): SocialField
    {
        if (empty($actors)) {
            return new SocialField(0.0, 0.0, 0.0, 0.0);
        }

        $aggression = 0.0;
        $rational = 0.0;
        $spiritual = 0.0;
        $conformity = 0.0;

        foreach ($actors as $actor) {
            // Mapping Actor traits to corresponding fields
            
            // Aggression: Dominance + Vengeance + Coercion
            $aggression += (
                ($actor->traits['Dominance'] ?? 0.0) + 
                ($actor->traits['Vengeance'] ?? 0.0) +
                ($actor->traits['Coercion'] ?? 0.0)
            ) / 3;

            // Rational: Curiosity + Pragmatism
            $rational += (
                ($actor->traits['Curiosity'] ?? 0.0) + 
                ($actor->traits['Pragmatism'] ?? 0.0)
            ) / 2;
            
            // Spiritual: Hope + Dogmatism
            $spiritual += (
                ($actor->traits['Hope'] ?? 0.0) + 
                ($actor->traits['Dogmatism'] ?? 0.0)
            ) / 2;

            // Conformity: Conformity + Solidarity + Loyalty
            $conformity += (
                ($actor->traits['Conformity'] ?? 0.0) + 
                ($actor->traits['Solidarity'] ?? 0.0) +
                ($actor->traits['Loyalty'] ?? 0.0)
            ) / 3;
        }

        $count = count($actors);

        return new SocialField(
            $aggression / $count,
            $rational / $count,
            $spiritual / $count,
            $conformity / $count
        );
    }
}
