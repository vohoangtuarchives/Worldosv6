<?php

namespace App\Simulation\Engines\Social;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\Log;

/**
 * CivilizationLongCycleEngine – simulates macro-cycles of history.
 * 
 * Cycles: Emergence → Expansion → Golden Age → Stagnation → Crisis → Collapse/Renewal.
 * Based on system vitality and institutional entropy.
 */
class CivilizationLongCycleEngine
{
    public const PHASE_EMERGENCE = 'emergence';
    public const PHASE_EXPANSION = 'expansion';
    public const PHASE_GOLDEN_AGE = 'golden_age';
    public const PHASE_STAGNATION = 'stagnation';
    public const PHASE_CRISIS = 'crisis';
    public const PHASE_COLLAPSE = 'collapse';

    public function compute(Universe $universe, UniverseSnapshot $snapshot): array
    {
        $fields = $snapshot->state_vector['fields'] ?? [];
        $metrics = $snapshot->metrics ?? [];
        
        $vitality = $this->calculateVitality($fields, $metrics);
        $entropy  = (float) ($fields['entropy'] ?? 0.3);
        $prevCycle = $snapshot->state_vector['cycle'] ?? $this->getDefaultCycle();
        
        $currentPhase = $prevCycle['phase'] ?? self::PHASE_EMERGENCE;
        $phaseTicks   = (int) ($prevCycle['phase_ticks'] ?? 0);
        
        $nextPhase = $currentPhase;
        
        // Phase Transition Logic
        switch ($currentPhase) {
            case self::PHASE_EMERGENCE:
                if ($vitality > 0.6 && $phaseTicks > 50) $nextPhase = self::PHASE_EXPANSION;
                break;
            case self::PHASE_EXPANSION:
                if ($fields['wealth'] > 0.7 && $fields['knowledge'] > 0.6) $nextPhase = self::PHASE_GOLDEN_AGE;
                if ($entropy > 0.6) $nextPhase = self::PHASE_STAGNATION;
                break;
            case self::PHASE_GOLDEN_AGE:
                if ($entropy > 0.5 || $vitality < 0.6) $nextPhase = self::PHASE_STAGNATION;
                break;
            case self::PHASE_STAGNATION:
                if ($entropy > 0.75 || ($metrics['instability'] ?? 0) > 0.7) $nextPhase = self::PHASE_CRISIS;
                if ($vitality > 0.7) $nextPhase = self::PHASE_EXPANSION; // Renewal
                break;
            case self::PHASE_CRISIS:
                if ($entropy > 0.9) $nextPhase = self::PHASE_COLLAPSE;
                if ($fields['order'] > 0.6 && $vitality > 0.5) $nextPhase = self::PHASE_STAGNATION; // Stabilized
                break;
            case self::PHASE_COLLAPSE:
                if ($phaseTicks > 30) $nextPhase = self::PHASE_EMERGENCE; // Deep cleaning then new start
                break;
        }

        return [
            'phase'       => $nextPhase,
            'vitality'    => $this->clamp($vitality),
            'phase_ticks' => ($nextPhase === $currentPhase) ? $phaseTicks + 1 : 0,
            'entropy_acc' => $this->clamp($entropy),
        ];
    }

    protected function calculateVitality(array $fields, array $metrics): float
    {
        $innovation = (float) ($fields['knowledge'] ?? 0.5);
        $cohesion   = (float) ($fields['meaning'] ?? 0.5);
        $surplus    = (float) ($fields['wealth'] ?? 0.5);
        $entropy    = (float) ($fields['entropy'] ?? 0.3);

        return ($innovation * 0.4 + $cohesion * 0.3 + $surplus * 0.3) - ($entropy * 0.2);
    }

    protected function getDefaultCycle(): array
    {
        return [
            'phase' => self::PHASE_EMERGENCE,
            'vitality' => 0.5,
            'phase_ticks' => 0,
            'entropy_acc' => 0.3
        ];
    }

    protected function clamp(float $v): float
    {
        return max(0.0, min(1.0, round($v, 4)));
    }
}
