<?php

namespace App\Modules\Intelligence\Services;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Actions\SpawnActorAction;
use App\Models\Universe;
use App\Services\Narrative\NarrativeGeneratorService;

class ActorEvolutionService
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository,
        private SpawnActorAction $spawnAction,
        private NarrativeGeneratorService $narrativeService
    ) {}

    /**
     * Logic trích xuất từ HeroicActorService: Tạo life record cho actor.
     */
    public function recordLifeEvent(int $actorId, int $tick, array $config): string
    {
        $actor = $this->actorRepository->findById($actorId);
        if (!$actor || !$actor->isAlive) return "";

        try {
            $event = $this->narrativeService->generateLifeEvent(
                $actor->name,
                $actor->archetype,
                $actor->traits,
                ['genre' => $config['genre'] ?? 'wuxia', 'style' => $config['naming_style'] ?? 'asian_classic']
            );
            
            $actor->biography .= "\n- T{$tick}: {$event}";
            $actor->incrementInfluence(0.1);
            
            $this->actorRepository->save($actor);
            
            return $event;
        } catch (\Exception $e) {
            return "Trải qua một kiếp nạn nhân sinh.";
        }
    }

    /**
     * Evolve existing actors: update traits, age them, or record life events.
     */
    public function evolve(Universe $universe, int $tick): void
    {
        $actors = \App\Models\Actor::where('universe_id', $universe->id)->where('is_alive', true)->get();

        foreach ($actors as $actor) {
            $traits = $actor->traits;
            
            // Trait drift (±2%)
            foreach ($traits as &$val) {
                $val = max(0, min(1, $val + (rand(-2, 2) / 100)));
            }
            $actor->traits = $traits;
            
            // Random life record (chance 20% per pulse)
            if (rand(1, 100) > 80) {
                $this->recordLifeEvent($actor->id, $tick, []);
            }

            // Life cycle
            $influence = $actor->metrics['influence'] ?? 0;
            $chanceOfDeath = $influence > 5.0 ? 0.02 : 0.005;

            if (rand(0, 1000) / 1000 < $chanceOfDeath) {
                $actor->is_alive = false;
                $actor->biography .= "\n- T" . $tick . ": Kết thúc một chương huyền thoại.";
            }

            $this->actorRepository->save($actor);
        }
    }

    public function generateRandomTraits(): array
    {
        $traits = [];
        $dimsCount = count(\App\Services\Simulation\HeroicActorService::TRAIT_DIMENSIONS);
        for ($i = 0; $i < $dimsCount; $i++) {
            $traits[] = rand(0, 100) / 100.0;
        }
        return $traits;
    }

    public function ensureMinimumPopulation(Universe $universe, int $min = 5): void
    {
        $count = $this->actorRepository->getActiveCount($universe->id);
        
        while ($count < $min) {
            $this->spawnAction->handle([
                'universe_id' => $universe->id,
                'name' => "Ẩn Sĩ " . rand(100, 999),
                'archetype' => 'Kẻ Lang Thang',
                'traits' => $this->generateRandomTraits(),
                'biography' => "Cảm ứng thiên địa, xuất thế giữa lúc năng lượng dao động mạnh.",
                'metrics' => ['influence' => 0.5],
            ]);
            $count++;
        }
    }
}
