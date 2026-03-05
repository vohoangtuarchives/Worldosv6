<?php

namespace App\Modules\Intelligence\Domain\Phase;

class PhaseDetector
{
    /**
     * Detects the macro-phase of the civilization continuously without hard branch statements.
     * Uses fuzzy logic/logistic blending.
     */
    public function detect(float $entropy, float $polarization, float $techLevel): PhaseScore
    {
        $fragmented = $entropy * $polarization;
        $information = $this->sigmoid($techLevel - 6) * (1 - $entropy) * (1 - $polarization);
        $industrial = $this->sigmoid($techLevel - 3) * (1 - $entropy);
        $feudal = $this->sigmoid($techLevel - 1) * (1 - $information) * (1 - $industrial);
        $primitive = 1 - max($fragmented, $information, $industrial, $feudal);

        // Normalize to prevent negative values from edge cases
        return new PhaseScore(
            primitive: max(0, $primitive),
            feudal: max(0, $feudal),
            industrial: max(0, $industrial),
            information: max(0, $information),
            fragmented: max(0, $fragmented)
        );
    }

    private function sigmoid(float $x): float
    {
        return 1.0 / (1.0 + exp(-$x));
    }
}
