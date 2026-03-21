<?php

namespace App\Modules\Geography\ValueObjects;

class Weather
{
    public const TYPE_CLEAR = 'clear';
    public const TYPE_RAIN = 'rain';
    public const TYPE_STORM = 'storm';
    public const TYPE_DROUGHT = 'drought';
    public const TYPE_SNOW = 'snow';

    public function __construct(
        public readonly string $type,
        public readonly int $durationTicks,
        public readonly float $intensity // [0, 1]
    ) {
    }

    /**
     * Mức độ ảnh hưởng lên chi phí di chuyển.
     * Mưa bão hoặc Tuyết rơi làm đi lại khó khăn hơn.
     */
    public function getTraversePenalty(): float
    {
        return match($this->type) {
            self::TYPE_CLEAR => 1.0,
            self::TYPE_RAIN => 1.2,
            self::TYPE_SNOW => 1.5,
            self::TYPE_STORM => 2.0,
            self::TYPE_DROUGHT => 1.1,
            default => 1.0,
        };
    }

    /**
     * Mức độ ảnh hưởng lên tốc độ hồi phục tài nguyên.
     * Mưa giúp cây lên nhanh, Hạn hán làm cây từ từ chết.
     */
    public function getRegenerationMultiplier(): float
    {
        return match($this->type) {
            self::TYPE_CLEAR => 1.0,
            self::TYPE_RAIN => 1.5,     // Boost growth
            self::TYPE_STORM => 0.8,    // Storm destroys some growth
            self::TYPE_DROUGHT => 0.2,  // Hard stop on growth
            self::TYPE_SNOW => 0.0,     // Winter freeze
            default => 1.0,
        };
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'duration_ticks' => $this->durationTicks,
            'intensity' => $this->intensity,
        ];
    }
}
