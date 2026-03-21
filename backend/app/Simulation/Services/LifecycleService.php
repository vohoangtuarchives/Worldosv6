<?php

namespace App\Simulation\Services;

use App\Simulation\Entities\Agent;
use App\Modules\Psychology\ValueObjects\TraitVector;
use Illuminate\Support\Str;

/**
 * Quản lý Sinh (Reproduction) và Tử (Death) của Agent.
 */
class LifecycleService
{
    /**
     * Agent chết khi health ≤ 0.
     * Trả về true nếu agent đã chết.
     */
    public function checkDeath(Agent $agent): bool
    {
        return !$agent->isAlive();
    }

    /**
     * 2 Agent có thể sinh con nếu:
     * - Cùng Tile
     * - Cả 2 đều sống, health > 50, hunger < 0.3 (no đủ)
     * - Trust cao (dựa vào psychology)
     * - Energy > 40
     * 
     * @return Agent|null Agent con (thừa hưởng gene pha trộn) hoặc null
     */
    public function tryReproduce(Agent $parent1, Agent $parent2): ?Agent
    {
        if ($parent1->x !== $parent2->x || $parent1->y !== $parent2->y) return null;
        if (!$parent1->isAlive() || !$parent2->isAlive()) return null;
        if ($parent1->health < 50 || $parent2->health < 50) return null;
        if ($parent1->hunger > 0.3 || $parent2->hunger > 0.3) return null;
        if ($parent1->energy < 40 || $parent2->energy < 40) return null;

        // Sinh con tốn năng lượng
        $parent1->consumeEnergy(30.0);
        $parent2->consumeEnergy(30.0);
        $parent1->hunger += 0.2;
        $parent2->hunger += 0.2;

        // Pha trộn TraitVector từ 2 bố mẹ (Genetic Blending)
        $childTraits = new TraitVector(
            openness: ($parent1->traits->openness + $parent2->traits->openness) / 2 + $this->mutationNoise(),
            conscientiousness: ($parent1->traits->conscientiousness + $parent2->traits->conscientiousness) / 2 + $this->mutationNoise(),
            extraversion: ($parent1->traits->extraversion + $parent2->traits->extraversion) / 2 + $this->mutationNoise(),
            agreeableness: ($parent1->traits->agreeableness + $parent2->traits->agreeableness) / 2 + $this->mutationNoise(),
            neuroticism: ($parent1->traits->neuroticism + $parent2->traits->neuroticism) / 2 + $this->mutationNoise()
        );

        $child = new Agent(
            id: (string) Str::uuid(),
            health: 80.0,
            energy: 50.0,
            hunger: 0.3,
            x: $parent1->x,
            y: $parent1->y,
            traits: $childTraits
        );

        // Bố mẹ vui
        $parent1->psychology->applyDelta(['joy' => 0.3, 'fear' => 0.0, 'stress' => 0.1, 'anger' => 0.0, 'sadness' => 0.0]);
        $parent2->psychology->applyDelta(['joy' => 0.3, 'fear' => 0.0, 'stress' => 0.1, 'anger' => 0.0, 'sadness' => 0.0]);

        return $child;
    }

    private function mutationNoise(): float
    {
        return (mt_rand(-10, 10) / 100.0); // [-0.1, 0.1] random drift
    }
}
