<?php

namespace App\Modules\WorldOS\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Universe;
use App\Models\World;
use App\Models\BranchEvent;
use App\Models\MaterialInstance;
use App\Models\Material;
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
        $query = Universe::with([
            'world:id,name,slug,current_genre,base_genre',
            'latestSnapshot'
        ]);
        
        if (request()->has('world_id')) {
            $query->where('world_id', (int) request('world_id'));
        }
        
        return response()->json($query->get());
    }

    public function toggleStatus(string $id): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        $newStatus = $universe->status === 'active' ? 'inactive' : 'active';
        $universe->update(['status' => $newStatus]);
        
        return response()->json(['ok' => true, 'new_status' => $newStatus]);
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
        $rows = \App\Models\UniverseSnapshot::where('universe_id', (int) $id)
            ->orderByDesc('tick')
            ->get(['id', 'universe_id', 'tick', 'entropy', 'stability_index', 'metrics', 'created_at']);
        return response()->json($rows);
    }

    public function getSnapshot(string $snapshotId): JsonResponse
    {
        $snapshot = \App\Models\UniverseSnapshot::findOrFail((int) $snapshotId);
        return response()->json($snapshot);
    }

    public function fork(string $id, \App\Modules\WorldOS\Actions\ForkUniverseAction $action): JsonResponse
    {
        $tick = (int) request()->input('tick', 0);
        $name = request()->input('name');
        $universe = Universe::findOrFail((int) $id);
        
        $child = $action->handle($universe, $tick, $name);
        
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

    public function update(string $id, Request $request): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        $universe->update($request->only(['name', 'status']));
        return response()->json(['ok' => true, 'data' => $universe]);
    }

    public function destroy(string $id): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        
        // Cảnh báo: Việc xóa universe sẽ xóa toàn bộ dữ liệu snapshots liên quan
        \App\Models\UniverseSnapshot::where('universe_id', $universe->id)->delete();
        $universe->delete();
        
        return response()->json(['ok' => true, 'message' => 'Universe đã được xóa thành công']);
    }
}
