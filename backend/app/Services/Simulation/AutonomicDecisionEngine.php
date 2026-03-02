<?php

namespace App\Services\Simulation;

use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ForkUniverseAction;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Saga;
use App\Repositories\UniverseRepository;
use Illuminate\Support\Facades\Log;

class AutonomicDecisionEngine
{
    protected int $branchLimit = 1;

    public function __construct(
        protected DecideUniverseAction $decideAction,
        protected ForkUniverseAction $forkAction,
        protected UniverseRepository $universeRepo,
        protected HeroicActorService $heroicService
    ) {}

    /**
     * Xử lý quyết định tự trị cho một Universe sau khi chạy tick.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        // 1. Quản lý vòng đời thực thể (Actors)
        $this->heroicService->spawnFromEvents($universe, (int)$snapshot->tick);
        $this->heroicService->evolve($universe, (int)$snapshot->tick);

        // 2. Quyết định chiến lược (Fork/Continue/Archive)
        $decision = $this->decideAction->execute($snapshot);
        $action = $decision['action'] ?? 'continue';
        $meta = $decision['meta'] ?? [];

        Log::info("Autonomic Engine Decision for Universe {$universe->id}: {$action}", $meta);

        if ($action === 'fork') {
            $this->handleFork($universe, (int)$snapshot->tick, $decision);
        } elseif ($action === 'continue') {
            // Có thể áp dụng thêm selective pressure tự động ở đây
        } elseif ($action === 'archive') {
            $this->universeRepo->update($universe->id, ['status' => 'archived']);
        }
    }

    /**
     * Xử lý rẽ nhánh với cơ chế Branch Concurrency Limit & Freeze-on-Fork.
     */
    protected function handleFork(Universe $universe, int $tick, array $decision): void
    {
        $saga = $universe->saga;
        if (!$saga) return;

        // Đếm số lượng nhánh đang hoạt động trong Saga
        $activeCount = Universe::where('saga_id', $saga->id)
            ->where('status', 'active')
            ->count();

        // Thực hiện Fork
        $childUniverse = $this->forkAction->execute($universe, $tick, $decision);

        if ($childUniverse) {
            Log::info("Autonomic Fork Created: Universe {$childUniverse->id} from {$universe->id}");

            // Nếu đã đạt hoặc vượt ngưỡng tối đa (mặc định là 1)
            // thì đóng băng (halt) nhánh cha.
            if ($activeCount >= $this->branchLimit) {
                $this->universeRepo->update($universe->id, ['status' => 'halted']);
                Log::info("Universe {$universe->id} halted due to Branch Concurrency Limit ({$this->branchLimit})");
            }
        }
    }
}
