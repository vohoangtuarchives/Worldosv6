<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Entities\ActorEntity;

class SpawnActorAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository
    ) {}

    public function handle(array $data): ActorEntity
    {
        $metrics = $data['metrics'] ?? ['influence' => 0.5];
        if (array_key_exists('spawned_at_tick', $data)) {
            $metrics['spawned_at_tick'] = $data['spawned_at_tick'];
        }
        if (!isset($metrics['physic'])) {
            $metrics['physic'] = ActorEntity::defaultPhysicVector();
        }
        $traits = $data['traits'] ?? $this->generateDefaultTraits();
        $defaultMaxAgeYears = max(1, (int) config('worldos.intelligence.default_max_age_years', 150));
        $metrics = ActorEntity::ensureLifeExpectancyInMetrics($metrics, $traits, $defaultMaxAgeYears);
        $energyMax = (float) config('worldos.intelligence.energy_max_default', 200);
        if (!array_key_exists('energy', $metrics)) {
            $metrics['energy'] = $energyMax;
            $metrics['max_energy'] = $energyMax;
        }
        if (!isset($metrics['metabolism'])) {
            $physic = $metrics['physic'] ?? null;
            $base = (float) config('worldos.intelligence.metabolism_base', 0.5);
            $agg = 0.5;
            if ($physic && is_array($physic)) {
                $v = array_values(array_filter($physic, 'is_numeric'));
                $agg = $v ? array_sum($v) / count($v) : 0.5;
            }
            $metrics['metabolism'] = $base * (0.6 + 0.2 * $agg);
        }

        $actor = new ActorEntity(
            id: null,
            universeId: $data['universe_id'],
            name: $data['name'],
            archetype: $data['archetype'],
            traits: $traits,
            metrics: $metrics,
            isAlive: true,
            generation: $data['generation'] ?? 1,
            biography: $data['biography'] ?? null
        );

        $this->actorRepository->save($actor);

        return $actor;
    }

    private function generateDefaultTraits(): array
    {
        // 18 dimensions: 17 gốc + Longevity (index 17)
        return array_fill(0, 18, 0.5);
    }
}
