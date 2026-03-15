<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\Log;

/**
 * CivilizationFieldTheoryEngine – Implementation of Academic Civilization Field Theory (CFT).
 * 
 * This engine manages 10 core and meta fields:
 *   Core: survival (S), power (P), wealth (W), knowledge (K), meaning (M)
 *   Meta: authority (A), fear (F), order (O), entropy (E), resonance (R)
 *
 * Evolution Equation: F_i(t+1) = α*Signal + β*Interaction + γ*Diffusion + δ*Inertia
 */
class CivilizationFieldTheoryEngine
{
    // Field Constants
    public const S = 'survival';
    public const P = 'power';
    public const W = 'wealth';
    public const K = 'knowledge';
    public const M = 'meaning';
    public const A = 'authority';
    public const F = 'fear';
    public const O = 'order';
    public const E = 'entropy';
    public const R = 'resonance';

    protected array $matrix = [
        self::S => [self::P => 0.1, self::W => 0.1, self::O => 0.1, self::E => -0.1],
        self::P => [self::W => 0.2, self::K => -0.3, self::A => 0.3, self::F => 0.1, self::O => 0.2, self::E => 0.1],
        self::W => [self::S => 0.1, self::P => 0.2, self::K => 0.2, self::A => 0.1, self::F => -0.1, self::O => 0.1],
        self::K => [self::P => -0.2, self::W => 0.1, self::M => 0.2, self::A => -0.1, self::F => -0.3, self::E => -0.1, self::R => 0.2],
        self::M => [self::S => 0.1, self::K => 0.2, self::A => 0.2, self::F => -0.2, self::O => 0.2, self::E => -0.1, self::R => 0.4],
        self::A => [self::P => 0.3, self::O => 0.4, self::F => 0.2, self::E => 0.1],
        self::F => [self::S => -0.2, self::P => 0.1, self::W => -0.2, self::K => -0.3, self::M => -0.2, self::A => 0.2, self::O => -0.3, self::E => 0.3],
        self::O => [self::S => 0.2, self::P => 0.2, self::W => 0.1, self::M => 0.1, self::A => 0.4, self::F => -0.2, self::E => -0.3, self::R => 0.1],
        self::E => [self::S => -0.3, self::P => -0.1, self::W => -0.2, self::K => -0.2, self::M => -0.2, self::A => -0.3, self::F => 0.3, self::O => -0.4, self::R => -0.3],
        self::R => [self::S => 0.1, self::P => 0.1, self::K => 0.2, self::M => 0.4, self::A => 0.1, self::F => -0.2, self::O => 0.2, self::E => -0.2],
    ];

    public function __construct(
        protected WorldWillEngine $willEngine
    ) {}

    /**
     * Phase 44: Compute fields from unified state manifold.
     */
    public function computeFromState(\App\Simulation\Runtime\State\WorldState $state, int $tick): array
    {
        $metrics = $state->get('ecosystem_metrics', []);
        $resonance = (float) $state->get('resonance_field', 0.5);
        $entropy = (float) $state->get('entropy', 0.5);

        $pop = (float) ($metrics['total_population'] ?? 0);
        $resourceStress = (float) ($metrics['resource_stress'] ?? 0.5);

        return [
            'survival'  => round(min(1.0, 0.2 + ($pop / 1000) * (1 - $resourceStress)), 4),
            'power'     => round(min(1.0, 0.1 + ($pop / 500) * $resonance), 4),
            'wealth'    => round(min(1.0, 0.1 + ($pop / 1000) * (1 - $entropy)), 4),
            'knowledge' => round(min(1.0, 0.05 + ($resonance * 0.8)), 4),
            'meaning'   => round($resonance, 4),
            'resonance' => $resonance,
            'entropy'   => $entropy,
            'order'     => round(1.0 - $entropy, 4),
            'fear'      => round($resourceStress * 0.8, 4),
            'authority' => round(min(1.0, 0.1 + $resonance * 0.5 + (1 - $entropy) * 0.4), 4),
        ];
    }

    public function compute(Universe $universe, UniverseSnapshot $snapshot): array
    {
        $state = array_merge(
            (array)($snapshot->state_vector ?? []),
            (array)($snapshot->metrics ?? [])
        );

        $prevFields = $state['fields'] ?? $this->getDefaultFields();
        $signals = $this->computeSignals($universe, $state);
        $interactions = $this->computeInteractions($prevFields);
        
        $fields = [];
        foreach ($this->getFieldKeys() as $key) {
            $sig = $signals[$key] ?? 0.5;
            $int = $interactions[$key] ?? 0.0;
            $prev = $prevFields[$key] ?? 0.5;

            // Integration Equation (Academic standard)
            // F_i(t+1) = 0.5*Signal + 0.2*Interaction + 0.3*Previous
            $value = (0.5 * $sig) + (0.2 * $int) + (0.3 * $prev);
            $fields[$key] = $this->clamp($value);
        }

        return $fields;
    }

    protected function computeSignals(Universe $universe, array $state): array
    {
        $alignment = $this->willEngine->calculateAlignment($universe);
        $spirituality = $alignment['spirituality'] ?? 0.33;
        $hardtech     = $alignment['hardtech'] ?? 0.33;
        $entropy      = $alignment['entropy'] ?? 0.34;

        $instPower = (float)($state['institutional_power'] ?? 0.5);
        $milCap    = (float)($state['military_capacity'] ?? 0.3);
        $tech      = (float)($state['technology_level'] ?? 0.3);
        $trade     = (float)($state['trade_volume'] ?? 0.3);
        $prod      = (float)($state['production'] ?? 0.3);
        $violence  = (float)($state['violence'] ?? 0.2);
        
        return [
            self::S => (0.5 * ($state['resource_density'] ?? 0.5)) + (0.3 * ($state['food_supply'] ?? 0.5)) - (0.2 * ($state['population_pressure'] ?? 0.0)),
            self::P => (0.6 * $instPower) + (0.4 * $milCap),
            self::W => (0.5 * $trade) + (0.5 * $prod) - (0.2 * ($state['entropy'] ?? 0.0)),
            self::K => (0.6 * $tech) + (0.4 * ($state['education_index'] ?? 0.3)) - (0.2 * ($state['fear'] ?? 0.0)),
            self::M => (0.5 * $spirituality) + (0.5 * ($state['cultural_coherence'] ?? 0.5)),
            
            self::A => (0.5 * ($state['power'] ?? 0.5)) + (0.3 * ($state['order'] ?? 0.5)) + (0.2 * ($state['fear'] ?? 0.0)),
            self::F => (0.5 * $violence) + (0.3 * ($state['entropy'] ?? 0.0)) - (0.2 * ($state['knowledge'] ?? 0.5)),
            self::O => (0.5 * ($state['authority'] ?? 0.5)) + (0.3 * ($state['survival'] ?? 0.5)) - (0.3 * ($state['entropy'] ?? 0.5)),
            self::E => (0.4 * ($state['population_pressure'] ?? 0.0)) + (0.3 * $violence) + (0.3 * ($state['institutional_decay'] ?? 0.1)),
            self::R => (0.4 * ($state['meaning'] ?? 0.5)) + (0.3 * ($state['knowledge'] ?? 0.5)) + (0.3 * ($state['order'] ?? 0.5)),
        ];
    }

    protected function computeInteractions(array $fields): array
    {
        $interactions = array_fill_keys($this->getFieldKeys(), 0.0);
        foreach ($fields as $j => $otherVal) {
            foreach ($this->matrix as $i => $row) {
                if (isset($row[$j])) {
                    $interactions[$i] += $otherVal * $row[$j];
                }
            }
        }
        return $interactions;
    }

    protected function getFieldKeys(): array
    {
        return [self::S, self::P, self::W, self::K, self::M, self::A, self::F, self::O, self::E, self::R];
    }

    protected function getDefaultFields(): array
    {
        return array_fill_keys($this->getFieldKeys(), 0.5);
    }

    protected function clamp(float $v): float
    {
        return max(0.0, min(1.0, round($v, 4)));
    }
}
