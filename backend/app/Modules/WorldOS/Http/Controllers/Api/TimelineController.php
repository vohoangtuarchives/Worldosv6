<?php

namespace App\Modules\WorldOS\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Universe;
use App\Modules\Narrative\Services\ChronicleSynthesisEngine;
use App\Modules\Narrative\Services\NarrativeAiService;
use App\Modules\Narrative\Services\UniverseHistoryGenerator;
use App\Modules\WorldOS\Http\Resources\TimelineEventResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimelineController extends Controller
{
    public function history(int $id, Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $facts = DB::table('historical_facts')
            ->where('universe_id', $id)
            ->orderByDesc('tick')
            ->limit($limit)
            ->get();

        return TimelineEventResource::collection($facts)
            ->additional([
                'meta' => [
                    'by_type' => $facts->groupBy('type')->map(static fn ($group) => $group->count()),
                ],
            ])
            ->response();
    }

    public function generateChronicle(string $id, Request $request, NarrativeAiService $narrativeAi): JsonResponse
    {
        $universeId = (int) $id;
        $universe = Universe::findOrFail($universeId);

        $fromTick = $request->input('from_tick');
        $toTick = $request->input('to_tick');

        if ($fromTick === null || $fromTick === '') {
            $first = $universe->snapshots()->orderBy('tick')->first();
            $latest = $universe->snapshots()->orderByDesc('tick')->first();
            $fromTick = $first ? (int) $first->tick : 0;
            $toTick = $toTick !== null && $toTick !== '' ? (int) $toTick : ($latest ? (int) $latest->tick : $fromTick);
        } else {
            $fromTick = (int) $fromTick;
            $latest = $universe->snapshots()->orderByDesc('tick')->first();
            $toTick = $toTick !== null && $toTick !== '' ? (int) $toTick : ($latest ? (int) $latest->tick : $fromTick);
        }

        $chronicle = $narrativeAi->generateChronicle($universeId, (int) $fromTick, (int) $toTick, 'chronicle');

        if (! $chronicle) {
            return response()->json(['message' => 'Khong the sinh su thi.'], 422);
        }

        return response()->json(['data' => [
            'id' => $chronicle->id,
            'content' => $chronicle->content,
            'from_tick' => $chronicle->from_tick,
            'to_tick' => $chronicle->to_tick,
        ]]);
    }

    public function generateHistory(string $id, Request $request, UniverseHistoryGenerator $historian): JsonResponse
    {
        $universe = Universe::findOrFail((int) $id);
        $fromTick = $request->has('from_tick') ? (int) $request->input('from_tick') : null;
        $toTick = $request->has('to_tick') ? (int) $request->input('to_tick') : null;

        $history = $historian->generate($universe, $fromTick, $toTick);

        if (! $history) {
            return response()->json(['message' => 'Loi khi tao lich su.'], 422);
        }

        return response()->json(['data' => [
            'id' => $history->id,
            'content' => $history->full_text,
            'from_tick' => $history->from_tick,
            'to_tick' => $history->to_tick,
        ]]);
    }

    public function causalLinks(string $id, ChronicleSynthesisEngine $synthesisEngine): JsonResponse
    {
        $links = $synthesisEngine->synthesize(
            (int) $id,
            (int) request('from_tick', 0),
            (int) request('to_tick', 1000000)
        );

        return response()->json([
            'data' => [
                'universe_id' => (int) $id,
                'links' => $links,
            ],
        ]);
    }
}
