<?php

namespace App\Modules\Intelligence\Domain\Archetype;

use App\Modules\Intelligence\Entities\ActorState;
use App\Modules\Intelligence\Domain\BehaviorStats;

class ArchetypeClassifier
{
    /** @var ArchetypeDefinition[] */
    private array $definitions = [];

    public function __construct()
    {
        $this->registerCoreArchetypes();
    }

    public function register(ArchetypeDefinition $definition): self
    {
        $this->definitions[$definition->name] = $definition;
        return $this;
    }

    /**
     * Classifies an actor by picking the definition with the highest score
     * adjusted by saturation, fitness, and inertia threshold.
     */
    public function classify(
        ActorState $actor,
        array $worldAxiom,
        float $entropy,
        array $currentPopulationRatios = [], // array of ['ArchetypeName' => 0.25], up to 1.0
        ?\App\Modules\Intelligence\Domain\Phase\PhaseScore $phaseScore = null
    ): ?string {
        $stats = BehaviorStats::fromArray($actor->metrics['behavior_stats'] ?? []);
        $stableCycles = $actor->metrics['archetype_stable_cycles'] ?? 0;

        // Inertia Check: Only drift if we've been stable long enough
        if ($stableCycles < 5) {
            // Can't drift yet
            return null; // Return null means no change
        }

        $scores = [];
        $currentArchetype = $actor->archetype;
        $currentMaxScore = 0.0;
        
        $fitnessProvider = new \App\Modules\Intelligence\Domain\Phase\FitnessLandscapeProvider();
        $multipliers = $phaseScore ? $fitnessProvider->getMultipliers($phaseScore) : [];
        
        foreach ($this->definitions as $def) {
            if (!$def->isEligible($worldAxiom)) {
                continue;
            }

            $rawScore = $def->score($actor, $stats, $entropy);
            
            // Saturation penalty (Replicator dynamics)
            $ratio = $currentPopulationRatios[$def->name] ?? 0.0;
            // E.g. penalty increases as ratio increases. If ratio is 0.5 (50%), multiplier is 0.5.
            $saturationPenalty = max(0.1, 1.0 - $ratio);
            
            // Phase modifier
            $fitnessMultiplier = $multipliers[$def->name] ?? 1.0; 

            $finalScore = $rawScore * $saturationPenalty * $fitnessMultiplier;
            $scores[$def->name] = $finalScore;

            if ($def->name === $currentArchetype) {
                $currentMaxScore = $finalScore;
            }
        }

        if (empty($scores)) {
            return null;
        }

        arsort($scores);
        $topName = array_key_first($scores);
        $topScore = $scores[$topName];

        // Drift condition: Delta > 0.25
        if ($topName !== $currentArchetype && ($topScore - $currentMaxScore) > 0.25) {
            return $topName; // Switch to new archetype
        }

        return null; // Keep current
    }

    private function registerCoreArchetypes(): void
    {
        // 1. Chiến Binh
        $this->register(new ArchetypeDefinition(
            name: 'Chiến Binh',
            namePrefix: 'Chiến Binh',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.4 * ($a->traits['Dominance'] ?? 0) + 
                0.3 * $b->getNorm('battles_norm') + 
                0.2 * ($a->traits['Coercion'] ?? 0) + 
                0.1 * ($a->traits['RiskTolerance'] ?? 0)
        ));

        // 2. Học Giả
        $this->register(new ArchetypeDefinition(
            name: 'Học Giả',
            namePrefix: 'Học Giả',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.5 * ($a->traits['Curiosity'] ?? 0) + 
                0.3 * $b->getNorm('research_norm') + 
                0.2 * ($a->traits['Pragmatism'] ?? 0)
        ));

        // 3. Tu Chân
        $this->register(new ArchetypeDefinition(
            name: 'Tu Chân Giả',
            namePrefix: 'Tu Tiên Giả',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.4 * $b->getNorm('spiritual_norm') + 
                0.3 * ($a->traits['Hope'] ?? 0) + 
                0.2 * (1 - ($a->traits['Dogmatism'] ?? 0)) + 
                $e * 0.3,
            condition: fn(array $axiom) => $axiom['has_linh_ki'] ?? false
        ));

        // 4. Tà Tu
        $this->register(new ArchetypeDefinition(
            name: 'Tà Tu',
            namePrefix: 'Ma Đầu',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.4 * $b->getNorm('spiritual_norm') + 
                0.3 * ($a->traits['Vengeance'] ?? 0) + 
                0.2 * ($a->traits['Dogmatism'] ?? 0) + 
                0.1 * $b->getNorm('crime_norm'),
            condition: fn(array $axiom) => $axiom['has_linh_ki'] ?? false
        ));
        
        // 5. Lãnh Đạo
        $this->register(new ArchetypeDefinition(
            name: 'Lãnh Đạo',
            namePrefix: 'Thủ Lĩnh',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.4 * ($a->traits['Dominance'] ?? 0) + 
                0.3 * $b->getNorm('lead_norm') + 
                0.3 * ($a->traits['Solidarity'] ?? 0)
        ));
        
        // 6. Kỹ Sư
        $this->register(new ArchetypeDefinition(
            name: 'Kỹ Sư',
            namePrefix: 'Thợ Máy',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.4 * ($a->traits['Pragmatism'] ?? 0) + 
                0.3 * ($a->traits['Curiosity'] ?? 0) + 
                0.3 * $b->getNorm('research_norm'),
            condition: fn(array $axiom) => ($axiom['tech_level'] ?? 1) >= 3
        ));

        // 7. Siêu CN (Rogue AI)
        $this->register(new ArchetypeDefinition(
            name: 'Đặc Biệt',
            namePrefix: 'Siêu CN',
            scoreFunction: fn(ActorState $a, BehaviorStats $b, float $e) => 
                0.5 * $b->getNorm('crime_norm') + 
                0.3 * ($a->traits['Pragmatism'] ?? 0) + 
                0.2 * ($a->traits['RiskTolerance'] ?? 0),
            condition: fn(array $axiom) => ($axiom['tech_level'] ?? 1) >= 8
        ));
    }
}
