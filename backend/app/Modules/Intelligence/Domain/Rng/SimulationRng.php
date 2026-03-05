<?php

namespace App\Modules\Intelligence\Domain\Rng;

final class SimulationRng
{
    private int $state;

    public function __construct(int $universeSeed, int $tick, int $actorId)
    {
        // Simple 32-bit state combining seeds, crc32 generates a 32-bit int.
        // We use string concat to ensure deterministic generation.
        // The cast to int ensures we get an integer even on 64 bit systems that can hold the uint returned by crc32.
        $this->state = (int) crc32("{$universeSeed}:{$tick}:{$actorId}") | 0xDEADBEEF;
    }

    /**
     * Implements a SplitMix64 or similar lightweight deterministic RNG algorithm
     * Modified for 32 bit PHP ints or generic usage.
     * @return float A float between 0 and 1
     */
    public function nextFloat(): float
    {
        // Ensure state is 64 bit capable (PHP mostly is 64 bit int)
        // A simple LCG or XorShift could also work, using simplified SplitMix64 principles:
        $this->state = (int) ($this->state + 0x9E3779B97F4A7C15);
        $z = $this->state;
        $z = (int) (($z ^ ($z >> 30)) * 0xBF58476D1CE4E5B9);
        $z = (int) (($z ^ ($z >> 27)) * 0x94D049BB133111EB);
        $z = $z ^ ($z >> 31);
        
        // Convert integer strictly to float between 0.0 and 1.0.
        // Max value handling considering signed integers.
        $maxInt = PHP_INT_MAX;
        $val = abs($z);
        return (float) ($val / $maxInt);
    }

    /**
     * @param float $min
     * @param float $max
     * @return float A random float between $min and $max
     */
    public function floatRange(float $min, float $max): float
    {
        return $min + ($max - $min) * $this->nextFloat();
    }
}
