<?php

namespace App\Modules\Intelligence\Entities;

class ActorEntity
{
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
     * Trait drift: Ngẫu nhiên thay đổi nhỏ các chỉ số tích cách.
     */
    public function driftTraits(float $variance = 0.02): void
    {
        if (!$this->isAlive) return;
        
        foreach ($this->traits as $key => &$val) {
            $drift = (rand(-100, 100) / 100.0) * $variance;
            $val = max(0, min(1, $val + $drift));
        }
    }

    /**
     * Life cycle: Kiểm tra sự lão hóa hoặc kết thúc vòng đời.
     */
    public function applyLifeCycle(float $entropy): void
    {
        if (rand(0, 100) < ($entropy * 50)) {
            $this->isAlive = false;
        }
    }

    public function applyAscension(int $tick): void
    {
        $this->isAlive = false;
        $this->biography .= " [ĐÃ PHI THĂNG TẠI TICK $tick]";
    }

    public function incrementInfluence(float $delta = 0.1): void
    {
        $this->metrics['influence'] = ($this->metrics['influence'] ?? 0) + $delta;
    }

    /**
     * Logic sinh tồn: Kiểm tra xem actor có còn sống sót qua tick này hay không.
     */
    public function processSurvival(float $entropy, float $worldStability): void
    {
        if (!$this->isAlive) return;

        // Logic đơn giản: Nếu entropy quá cao và may mắn thấp -> Chết
        $survivalThreshold = 0.9 * (1 - $worldStability);
        $deathRoll = ($this->traits['luck'] ?? 0.5) * (1 - $entropy);

        if ($deathRoll < $survivalThreshold) {
            $this->isAlive = false;
        }
    }

    /**
     * Logic phát triển: Cập nhật các chỉ số dựa trên hành động thành công.
     */
    public function evolveTraits(array $successfulActions): void
    {
        foreach ($successfulActions as $action) {
            $trait = $this->mapActionToTrait($action);
            if ($trait) {
                $this->traits[$trait] = min(1.0, ($this->traits[$trait] ?? 0.1) + 0.05);
            }
        }
    }

    private function mapActionToTrait(string $action): ?string
    {
        return match($action) {
            'combat' => 'strength',
            'research' => 'intelligence',
            'trade' => 'charisma',
            default => null
        };
    }
}
