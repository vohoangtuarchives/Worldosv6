<?php

namespace App\Modules\Institutions\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Institutions\Contracts\SupremeEntityRepositoryInterface;
use App\Modules\Institutions\Actions\SpawnSupremeEntityAction;
use App\Modules\Institutions\Actions\AscendHeroAction;

class SupremeEntityEvolutionService
{
    public function __construct(
        private SupremeEntityRepositoryInterface $supremeEntityRepository,
        private SpawnSupremeEntityAction $spawnAction,
        private AscendHeroAction $ascendHeroAction
    ) {}

    public function processPulse(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $metrics = $snapshot->metrics ?? [];
        
        // 1. Natural Emergence
        $this->evaluateNaturalEmergence($universe, (int)$snapshot->tick, (float)$snapshot->entropy, $metrics);

        // 2. Ascended Heroes
        $this->ascendHeroAction->handle($universe, $snapshot);

        // 3. Impact on World
        $this->applyCosmicImpact($universe, $snapshot, $metrics);
    }

    protected function evaluateNaturalEmergence(Universe $universe, int $tick, float $entropy, array $metrics): void
    {
        $energyLevel = (float) ($metrics['energy_level'] ?? 0.5);

        // World Will
        if ($energyLevel > 0.8 && $entropy < 0.25 && mt_rand(1, 100) <= 5) {
             $this->spawnAction->handle($universe, $tick, [
                'name' => 'Thiên Ý Nguyên Thủy',
                'entity_type' => 'world_will',
                'domain' => 'Trật Tự Tuyệt Đối',
                'power_level' => 1.0,
                'alignment' => ['spirituality' => 0.9, 'hardtech' => 0.1, 'entropy' => 0.0, 'energy_level' => 1.0]
            ]);
        }

        // Outer God
        if ($entropy > 0.9 && mt_rand(1, 100) <= 10) {
            $this->spawnAction->handle($universe, $tick, [
                'name' => 'Thực Thể Viễn Cổ',
                'entity_type' => 'outer_god',
                'domain' => 'Hỗn Độn Vô Hạn',
                'power_level' => 1.5,
                'alignment' => ['spirituality' => 0.5, 'hardtech' => 0.5, 'entropy' => 1.0, 'energy_level' => 0.9]
            ]);
        }
    }

    protected function applyCosmicImpact(Universe $universe, UniverseSnapshot $snapshot, array &$metrics): void
    {
        $entities = $this->supremeEntityRepository->findByUniverse($universe->id);
        $activeEntities = array_filter($entities, fn($e) => $e->status === 'active');

        if (empty($activeEntities)) return;

        $ethos = $metrics['ethos'] ?? [];
        $state = [
            'spirituality' => (float) ($ethos['spirituality'] ?? 0.5),
            'hardtech' => (float) ($ethos['openness'] ?? 0.5),
            'entropy' => (float) ($snapshot->entropy ?? 0.5),
            'energy_level' => (float) ($metrics['energy_level'] ?? 0.5),
        ];

        foreach ($activeEntities as $entity) {
            $alignment = $entity->alignment;
            $dt = 0.05 * $entity->powerLevel;

            foreach (['spirituality', 'hardtech', 'entropy', 'energy_level'] as $dim) {
                if (isset($alignment[$dim])) {
                    $state[$dim] += ($alignment[$dim] - $state[$dim]) * $dt;
                }
            }
        }

        // Update snapshot
        $ethos['spirituality'] = max(0.0, min(1.0, $state['spirituality']));
        $ethos['openness'] = max(0.0, min(1.0, $state['hardtech']));
        $metrics['ethos'] = $ethos;
        $metrics['energy_level'] = max(0.0, min(1.0, $state['energy_level']));
        
        $snapshot->entropy = max(0.0, min(1.0, $state['entropy']));
        $snapshot->metrics = $metrics;
        $snapshot->save();
    }
}
