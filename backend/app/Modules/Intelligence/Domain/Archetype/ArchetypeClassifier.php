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

    public function getDefinition(string $name): ?ArchetypeDefinition
    {
        return $this->definitions[$name] ?? null;
    }

    /**
     * Classifies an actor by picking the definition with the highest score
     * adjusted by saturation, fitness, and inertia threshold.
     */
    public function classify(
        ActorState $actor,
        array $worldAxiom,
        float $entropy,
        array $currentPopulationRatios = [],
        ?\App\Modules\Intelligence\Domain\Phase\PhaseScore $phaseScore = null,
        array $zoneFields = [] // Added to context
    ): ?string {
        $stats = BehaviorStats::fromArray($actor->metrics['behavior_stats'] ?? []);
        $stableCycles = $actor->metrics['archetype_stable_cycles'] ?? 0;
        
        $cognitiveState = $actor->metrics['cognitive_state'] ?? null;
        $isInertiaIncreased = $cognitiveState !== null;

        $requiredCycles = $isInertiaIncreased ? 10 : 5;
        if ($stableCycles < $requiredCycles) {
            return null; 
        }

        $scores = [];
        $currentArchetype = $actor->archetype;
        $currentMaxScore = 0.0;
        
        // Map Actor Traits to 8D Motivation Dimensions for InternalFit
        $actor8D = $this->mapTraitsTo8D($actor->traits);

        foreach ($this->definitions as $def) {
            if (!$def->isEligible($worldAxiom)) {
                continue;
            }

            // 1. Environment Reward (dot product with Zone Fields)
            $envReward = 0.0;
            if (!empty($zoneFields)) {
                foreach ($def->motivationVector as $key => $weight) {
                    $envReward += $weight * ($zoneFields[$key] ?? 0.5);
                }
            }

            // 2. Internal Fit (dot product with Actor's 8D profile)
            $internalFit = 0.0;
            foreach ($def->motivationVector as $key => $weight) {
                $internalFit += $weight * ($actor8D[$key] ?? 0.5);
            }

            // 3. Saturation Penalty (Replicator dynamics)
            $ratio = $currentPopulationRatios[$def->name] ?? 0.0;
            $target = $def->distributionTarget;
            $penalty = ($ratio > $target) ? ($ratio - $target) * 2.0 : 0.0;

            // Final Emergence Score
            $finalScore = ($envReward * 0.4) + ($internalFit * 0.6) - $penalty;
            
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

        // Drift condition: Delta > 0.15 (More fluid emergence)
        if ($topName !== $currentArchetype && ($topScore - $currentMaxScore) > 0.15) {
            return $topName;
        }

        return null; 
    }

    private function mapTraitsTo8D(array $traits): array
    {
        return [
            'survival'     => ($traits['Resilience'] ?? 0.5),
            'reproduction' => ($traits['Vitality'] ?? 0.5),
            'wealth'       => ($traits['Pragmatism'] ?? 0.5) * 0.7 + ($traits['Ambition'] ?? 0.5) * 0.3,
            'power'        => ($traits['Dominance'] ?? 0.5) * 0.6 + ($traits['Coercion'] ?? 0.5) * 0.4,
            'knowledge'    => ($traits['Curiosity'] ?? 0.5),
            'meaning'      => ($traits['Hope'] ?? 0.5) * 0.7 + (1 - ($traits['Dogmatism'] ?? 0.5)) * 0.3,
            'status'       => ($traits['Pride'] ?? 0.5) * 0.8 + ($traits['Dominance'] ?? 0.5) * 0.2,
            'belonging'    => ($traits['Solidarity'] ?? 0.5) * 0.4 + ($traits['Conformity'] ?? 0.5) * 0.3 + ($traits['Loyalty'] ?? 0.3),
        ];
    }

    private function registerCoreArchetypes(): void
    {
        // 1. Commoner (Người nền) - Distribution Target: 50%
        $this->register(new ArchetypeDefinition(
            name: 'Người Thường',
            namePrefix: 'Thường Dân',
            scoreFunction: fn() => 1.0, 
            motivationVector: ['survival' => 0.9, 'reproduction' => 0.9, 'belonging' => 0.8, 'wealth' => 0.4],
            distributionTarget: 0.50
        ));

        // 2. Producer (Người sản xuất) - 20%
        $this->register(new ArchetypeDefinition(
            name: 'Người Sản Xuất',
            namePrefix: 'Thợ',
            scoreFunction: fn() => 1.0,
            motivationVector: ['survival' => 0.7, 'wealth' => 0.8, 'reproduction' => 0.5, 'knowledge' => 0.4],
            distributionTarget: 0.20
        ));

        // 3. Merchant (Thương nhân) - 8%
        $this->register(new ArchetypeDefinition(
            name: 'Thương Nhân',
            namePrefix: 'Phú Hộ',
            scoreFunction: fn() => 1.0,
            motivationVector: ['wealth' => 0.9, 'status' => 0.7, 'survival' => 0.5, 'power' => 0.4],
            distributionTarget: 0.08
        ));

        // 4. Scholar (Học giả) - 4%
        $this->register(new ArchetypeDefinition(
            name: 'Học Giả',
            namePrefix: 'Sĩ Phu',
            scoreFunction: fn() => 1.0,
            motivationVector: ['knowledge' => 0.9, 'status' => 0.8, 'meaning' => 0.6, 'survival' => 0.3],
            distributionTarget: 0.04
        ));

        // 5. Engineer (Kỹ sư) - 4%
        $this->register(new ArchetypeDefinition(
            name: 'Kỹ Sư',
            namePrefix: 'Thợ Kỹ',
            scoreFunction: fn() => 1.0,
            motivationVector: ['knowledge' => 0.8, 'wealth' => 0.7, 'status' => 0.6, 'survival' => 0.4],
            distributionTarget: 0.04
        ));

        // 6. Explorer (Hành giả) - 2%
        $this->register(new ArchetypeDefinition(
            name: 'Hành Giả',
            namePrefix: 'Lãng Tử',
            scoreFunction: fn() => 1.0,
            motivationVector: ['survival' => 0.7, 'knowledge' => 0.8, 'wealth' => 0.5, 'power' => 0.4],
            distributionTarget: 0.02
        ));

        // 7. Warrior (Chiến binh) - 5%
        $this->register(new ArchetypeDefinition(
            name: 'Chiến Binh',
            namePrefix: 'Dũng Sĩ',
            scoreFunction: fn() => 1.0,
            motivationVector: ['power' => 0.9, 'status' => 0.8, 'survival' => 0.6, 'belonging' => 0.5],
            distributionTarget: 0.05
        ));

        // 8. Guardian (Hộ vệ) - 3%
        $this->register(new ArchetypeDefinition(
            name: 'Hộ Vệ',
            namePrefix: 'Chấp Pháp',
            scoreFunction: fn() => 1.0,
            motivationVector: ['power' => 0.8, 'belonging' => 0.8, 'status' => 0.7, 'survival' => 0.6],
            distributionTarget: 0.03
        ));

        // 9. Leader (Lãnh đạo) - 1%
        $this->register(new ArchetypeDefinition(
            name: 'Lãnh Đạo',
            namePrefix: 'Vương',
            scoreFunction: fn() => 1.0,
            motivationVector: ['power' => 0.9, 'status' => 0.9, 'belonging' => 0.8, 'wealth' => 0.6],
            distributionTarget: 0.01
        ));

        // 10. Priest (Tu sĩ) - 3%
        $this->register(new ArchetypeDefinition(
            name: 'Tu Sĩ',
            namePrefix: 'Đạo Sĩ',
            scoreFunction: fn() => 1.0,
            motivationVector: ['meaning' => 0.9, 'status' => 0.7, 'belonging' => 0.6, 'knowledge' => 0.6],
            distributionTarget: 0.03
        ));

        // 11. Zealot (Tín đồ) - 3%
        $this->register(new ArchetypeDefinition(
            name: 'Tín Đồ',
            namePrefix: 'Kẻ Sùng Đạo',
            scoreFunction: fn() => 1.0,
            motivationVector: ['belonging' => 0.9, 'meaning' => 0.8, 'power' => 0.6, 'survival' => 0.5],
            distributionTarget: 0.03
        ));

        // 12. Trickster (Kẻ phá bĩnh) - 1%
        $this->register(new ArchetypeDefinition(
            name: 'Kẻ Phá Bĩnh',
            namePrefix: 'Dị Nhân',
            scoreFunction: fn() => 1.0,
            motivationVector: ['knowledge' => 0.7, 'power' => 0.7, 'status' => 0.8, 'wealth' => 0.5],
            distributionTarget: 0.01
        ));
    }
}
