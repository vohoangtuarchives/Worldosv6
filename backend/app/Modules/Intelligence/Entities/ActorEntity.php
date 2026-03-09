<?php

namespace App\Modules\Intelligence\Entities;

use App\Modules\Intelligence\Entities\ActorState;

class ActorEntity
{
    public const TRAIT_DIMENSIONS = [
        'Dominance',    // 0
        'Ambition',     // 1
        'Coercion',     // 2
        'Loyalty',      // 3
        'Empathy',      // 4
        'Solidarity',   // 5
        'Conformity',   // 6
        'Pragmatism',   // 7
        'Curiosity',    // 8
        'Dogmatism',    // 9
        'RiskTolerance',// 10
        'Fear',         // 11
        'Vengeance',    // 12
        'Hope',         // 13
        'Grief',        // 14
        'Pride',        // 15
        'Shame',        // 16
        'Longevity',    // 17 — tuổi thọ tương đối (0–1), dùng cho max_age và xác suất sống sót
    ];

    /**
     * Huyết mạch / Physic vector: nhiều yếu tố thể chất (0–1 mỗi chiều).
     * Lưu trong metrics['physic'] dạng array index theo thứ tự dưới đây.
     * Dùng cho survival (aggregate), narrative, có thể drift/evolve riêng.
     */
    public const PHYSIC_DIMENSIONS = [
        'Vitality',   // 0 — sinh lực, khả năng hồi phục
        'Stamina',    // 1 — sức bền, chịu đựng
        'Strength',   // 2 — sức mạnh thể chất
        'Endurance',  // 3 — độ bền trước stress/tổn thương
        'Resilience', // 4 — thể chất chống entropy (tách khỏi trait RiskTolerance)
    ];

    public static function defaultPhysicVector(): array
    {
        return array_fill(0, count(self::PHYSIC_DIMENSIONS), 0.5);
    }

    public function __construct(
        public readonly ?int $id,
        public readonly int $universeId,
        public string $name,
        public string $archetype,
        public array $traits = [],
        public array $metrics = [],
        public bool $isAlive = true,
        public int $generation = 1,
        public ?string $biography = null
    ) {}

    /**
     * Increment the influence metric.
     */
    public function incrementInfluence(float $delta = 0.1): void
    {
        $this->metrics['influence'] = ($this->metrics['influence'] ?? 0) + $delta;
    }

    /**
     * Mark actor as ascended.
     */
    public function applyAscension(int $tick): void
    {
        $this->isAlive = false;
        $this->biography .= " [ĐÃ PHI THĂNG TẠI TICK $tick]";
    }

    /**
     * Convert this Entity to the Immutable ActorState used by the Engine.
     */
    public function toState(): ActorState
    {
        return new ActorState(
            id: $this->id,
            universeId: $this->universeId,
            name: $this->name,
            archetype: $this->archetype,
            traits: $this->traits,
            metrics: $this->metrics,
            isAlive: $this->isAlive,
            generation: $this->generation,
            biography: $this->biography
        );
    }

    /**
     * Hydrate Entity from an Immutable ActorState.
     */
    public function fromState(ActorState $state): void
    {
        $this->name = $state->name;
        $this->archetype = $state->archetype;
        $this->traits = $state->traits;
        $this->metrics = $state->metrics;
        $this->isAlive = $state->isAlive;
        $this->generation = $state->generation;
        $this->biography = $state->biography;
    }
}
