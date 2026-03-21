<?php

namespace App\Modules\Geography\ValueObjects;

use InvalidArgumentException;

/**
 * Tile đại diện cho 1 ô trên bản đồ của WorldOS.
 * Biome quyết định loại tài nguyên có thể sinh ra và chi phí di chuyển (Traverse Cost).
 */
class Tile
{
    public const BIOME_PLAINS = 'plains';
    public const BIOME_FOREST = 'forest';
    public const BIOME_MOUNTAIN = 'mountain';
    public const BIOME_DESERT = 'desert';
    public const BIOME_WATER = 'water';

    public function __construct(
        public readonly int $x,
        public readonly int $y,
        public readonly string $biome,
        public readonly string $elevation = 'flat', // flat, hill, high
    ) {
        $this->validateBiome();
    }

    /**
     * Lấy chi phí di chuyển qua ô này. Lớn hơn = chậm hơn.
     */
    public function getTraverseCost(): float
    {
        $cost = match($this->biome) {
            self::BIOME_PLAINS => 1.0,
            self::BIOME_FOREST => 1.5,
            self::BIOME_MOUNTAIN => 3.0,
            self::BIOME_DESERT => 2.0,
            self::BIOME_WATER => 5.0, // Rất khó trừ khi có thuyền
            default => 1.0,
        };

        if ($this->elevation === 'hill') {
            $cost *= 1.5;
        } elseif ($this->elevation === 'high') {
            $cost *= 2.0;
        }

        return $cost;
    }

    public function isWalkable(): bool
    {
        return $this->biome !== self::BIOME_WATER && $this->elevation !== 'high'; // Đỉnh núi cao không thể đi
    }

    private function validateBiome(): void
    {
        $validBiomes = [self::BIOME_PLAINS, self::BIOME_FOREST, self::BIOME_MOUNTAIN, self::BIOME_DESERT, self::BIOME_WATER];
        if (!in_array($this->biome, $validBiomes, true)) {
            throw new InvalidArgumentException("Invalid biome type: {$this->biome}");
        }
    }

    public function toArray(): array
    {
        return [
            'x' => $this->x,
            'y' => $this->y,
            'biome' => $this->biome,
            'elevation' => $this->elevation,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['x'],
            $data['y'],
            $data['biome'],
            $data['elevation'] ?? 'flat'
        );
    }
}
