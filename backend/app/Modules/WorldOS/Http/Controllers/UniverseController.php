<?php

namespace App\Modules\WorldOS\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\World;
use App\Modules\Simulation\Models\BranchEvent;
use App\Modules\Simulation\Models\MaterialInstance;
use App\Modules\Simulation\Models\Material;
use App\Modules\Simulation\Repositories\UniverseSnapshotRepository;
use App\Modules\Simulation\Services\ImplicitOrchestratorService;
use App\Modules\Simulation\Actions\AdvanceSimulationAction;
use App\Modules\Simulation\Actions\PulseWorldAction;
use App\Modules\Simulation\Actions\WorldAxiomAction;
use App\Modules\Simulation\Actions\ExportWorldAction;
use App\Modules\Simulation\Actions\ImportWorldAction;
use App\Modules\Simulation\Actions\GetUniverseTopologyAction;
use App\Contracts\UniverseEvaluatorInterface;
use App\Contracts\Repositories\UniverseRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class UniverseController extends Controller
{
    public function index(): JsonResponse
    {
        $query = Universe::with(['world:id,name,slug,current_genre,base_genre']);
        if (request()->has('world_id')) {
            $query->where('world_id', (int) request('world_id'));
        }
        return response()->json($query->get());
    }

    public function show(string $id): JsonResponse
    {
        $universe = Universe::with(['world:id,name,slug,axiom,origin,current_genre,base_genre,is_autonomic'])->findOrFail((int) $id);
        $universe->update(['last_observed_at' => now()]);
        return response()->json(['data' => $universe]);
    }

    public function snapshot(string $id, UniverseSnapshotRepository $repo): JsonResponse
    {
        $snapshot = $repo->getLatest((int) $id);
        if (! $snapshot) {
            return response()->json(['message' => 'Không tìm thấy snapshot'], 404);
        }
        return response()->json($snapshot);
    }

    public function snapshots(string $id): JsonResponse
    {
        $limit = (int) request()->query('limit', 50);
        $limit = $limit > 0 && $limit <= 500 ? $limit : 50;
        $rows = \App\Modules\Simulation\Models\UniverseSnapshot::where('universe_id', (int) $id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get(['id', 'universe_id', 'tick', 'entropy', 'stability_index', 'metrics'])
            ->toArray();
        return response()->json(array_reverse($rows));
    }

    public function fork(string $id, ImplicitOrchestratorService $orchestrator): JsonResponse
    {
        $tick = (int) request()->input('tick', 0);
        $universe = Universe::findOrFail((int) $id);
        
        // Use repository in future, for now keep original logic to ensure stability
        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick > 0 ? $tick : (int) $universe->current_tick,
            'event_type' => 'fork',
            'payload' => ['manual' => true],
        ]);
        
        $child = $orchestrator->spawnUniverse($universe->world, $universe->id, $universe->saga_id);
        return response()->json(['ok' => true, 'child_universe_id' => $child->id]);
    }

    public function pulse(string $id, PulseWorldAction $action): JsonResponse
    {
        $world = World::findOrFail((int) $id);
        return response()->json([
            'ok' => true, 
            'results' => $action->execute($world, (int) request()->input('ticks_per_universe', 5))
        ]);
    }

    public function advance(AdvanceSimulationAction $action): JsonResponse
    {
        $universeId = (int) request()->input('universe_id', 0);
        $ticks = (int) request()->input('ticks', 1);
        return response()->json($action->execute($universeId, $ticks));
    }
}
