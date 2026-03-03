<?php

namespace App\Modules\Intelligence\Actions;

use App\Models\Universe;
use App\Models\BranchEvent;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;

class SpawnFromEventsAction
{
    public function __construct(
        private SpawnActorAction $spawnActorAction,
        private ActorRepositoryInterface $actorRepository
    ) {}

    public function handle(Universe $universe, int $tick): void
    {
        // 1. Spawn from significant events
        $events = BranchEvent::where('universe_id', $universe->id)
            ->where('event_type', 'micro_crisis')
            ->where('from_tick', '>=', $tick - 10)
            ->get();

        foreach ($events as $event) {
            $payload = $event->payload;
            if (isset($payload['winner'])) {
                $this->spawnActorAction->handle([
                    'universe_id' => $universe->id,
                    'name' => $payload['winner']['name'] ?? 'Vị Anh Hùng Vô Danh',
                    'archetype' => $payload['winner']['archetype'] ?? 'Kẻ Lang Thang',
                    'traits' => $payload['winner']['traits'] ?? null,
                    'biography' => "Ghi danh bảng vàng sau biến cố: " . ($payload['description'] ?? 'Loạn lạc'),
                    'metrics' => ['influence' => 1.0],
                ]);
            }
        }
        
        // 2. Ensure population minimum (Always 5)
        while ($this->actorRepository->getActiveCount($universe->id) < 5) {
             $this->spawnSpontaneousActor($universe);
        }
    }

    private function spawnSpontaneousActor(Universe $universe): void
    {
        // Note: For now, we still rely on some hardcoded names or generic ones
        // In a real scenario, we would use a NameGeneratorService
        $this->spawnActorAction->handle([
            'universe_id' => $universe->id,
            'name' => "Ẩn Sĩ " . rand(100, 999),
            'archetype' => 'Kẻ Lang Thang',
            'biography' => "Cảm ứng thiên địa, xuất thế giữa lúc năng lượng dao động mạnh.",
            'metrics' => ['influence' => 0.5],
        ]);
    }
}
