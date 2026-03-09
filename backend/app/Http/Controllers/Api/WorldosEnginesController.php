<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Saga;
use App\Models\Universe;
use App\Models\World;
use App\Modules\Simulation\Services\CivilizationMemoryEngine;
use App\Modules\Simulation\Services\GreatPersonEngine;
use App\Modules\Simulation\Services\IdeologyEvolutionEngine;
use App\Modules\Simulation\Services\MythologyGeneratorEngine;
use App\Modules\Simulation\Services\NarrativeExtractionEngine;
use App\Modules\Simulation\Services\TimelineSelectionEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase J: API for WorldOS Engines (Timeline Selection, Extract Lore, Civilization Memory,
 * Mythology, Ideology, Great Person). All under auth:sanctum.
 */
class WorldosEnginesController extends Controller
{
    public function worldTimelines(
        string $id,
        TimelineSelectionEngine $engine,
        Request $request
    ): JsonResponse {
        $world = World::find((int) $id);
        if (! $world) {
            return response()->json(['message' => 'World not found'], 404);
        }
        $limit = $request->query('limit') !== null ? (int) $request->query('limit') : null;
        $universes = $engine->selectBest($world, $limit);
        return response()->json([
            'world_id' => $world->id,
            'timelines' => $universes->map(fn ($u) => ['id' => $u->id, 'name' => $u->name ?? ''])->values(),
        ]);
    }

    public function sagaTimelines(
        string $id,
        TimelineSelectionEngine $engine,
        Request $request
    ): JsonResponse {
        $saga = Saga::find((int) $id);
        if (! $saga) {
            return response()->json(['message' => 'Saga not found'], 404);
        }
        $limit = $request->query('limit') !== null ? (int) $request->query('limit') : null;
        $universes = $engine->selectBestForSaga($saga, $limit);
        return response()->json([
            'saga_id' => $saga->id,
            'timelines' => $universes->map(fn ($u) => ['id' => $u->id, 'name' => $u->name ?? ''])->values(),
        ]);
    }

    public function worldExtractLore(
        string $id,
        NarrativeExtractionEngine $engine,
        Request $request
    ): JsonResponse {
        $world = World::find((int) $id);
        if (! $world) {
            return response()->json(['message' => 'World not found'], 404);
        }
        $limit = $request->input('limit') ?? $request->query('limit');
        $limit = $limit !== null ? (int) $limit : null;
        $chronicles = $engine->extractBestFromWorld($world, $limit);
        return response()->json([
            'world_id' => $world->id,
            'chronicles' => $chronicles->map(fn ($c) => [
                'id' => $c->id,
                'universe_id' => $c->universe_id,
                'from_tick' => $c->from_tick,
                'to_tick' => $c->to_tick,
                'type' => $c->type,
            ])->values(),
        ]);
    }

    public function sagaExtractLore(
        string $id,
        NarrativeExtractionEngine $engine,
        Request $request
    ): JsonResponse {
        $saga = Saga::find((int) $id);
        if (! $saga) {
            return response()->json(['message' => 'Saga not found'], 404);
        }
        $limit = $request->input('limit') ?? $request->query('limit');
        $limit = $limit !== null ? (int) $limit : null;
        $chronicles = $engine->extractBestFromSaga($saga, $limit);
        return response()->json([
            'saga_id' => $saga->id,
            'chronicles' => $chronicles->map(fn ($c) => [
                'id' => $c->id,
                'universe_id' => $c->universe_id,
                'from_tick' => $c->from_tick,
                'to_tick' => $c->to_tick,
                'type' => $c->type,
            ])->values(),
        ]);
    }

    public function civilizationMemory(
        string $id,
        CivilizationMemoryEngine $engine,
        Request $request
    ): JsonResponse {
        $universe = Universe::find((int) $id);
        if (! $universe) {
            return response()->json(['message' => 'Universe not found'], 404);
        }
        $fromTick = $request->query('from_tick') !== null ? (int) $request->query('from_tick') : null;
        $toTick = $request->query('to_tick') !== null ? (int) $request->query('to_tick') : null;
        $memory = $engine->getMemory($universe, $fromTick, $toTick);
        return response()->json($memory);
    }

    public function mythology(
        string $id,
        MythologyGeneratorEngine $engine,
        Request $request
    ): JsonResponse {
        $universe = Universe::find((int) $id);
        if (! $universe) {
            return response()->json(['message' => 'Universe not found'], 404);
        }
        $fromTick = $request->input('from_tick') ?? $request->query('from_tick');
        $toTick = $request->input('to_tick') ?? $request->query('to_tick');
        $fromTick = $fromTick !== null ? (int) $fromTick : null;
        $toTick = $toTick !== null ? (int) $toTick : null;
        $chronicle = $engine->generateFromUniverse($universe, $fromTick, $toTick);
        if (! $chronicle) {
            return response()->json(['message' => 'Mythology generation failed'], 500);
        }
        return response()->json([
            'chronicle_id' => $chronicle->id,
            'universe_id' => $universe->id,
            'from_tick' => $chronicle->from_tick,
            'to_tick' => $chronicle->to_tick,
        ]);
    }

    public function ideology(string $id, IdeologyEvolutionEngine $engine): JsonResponse
    {
        $universe = Universe::find((int) $id);
        if (! $universe) {
            return response()->json(['message' => 'Universe not found'], 404);
        }
        $result = $engine->getDominantIdeology($universe);
        return response()->json([
            'universe_id' => $universe->id,
            'dominant' => $result['dominant'],
            'institution_count' => $result['institution_count'],
            'previous_dominant' => $result['previous_dominant'],
        ]);
    }

    public function greatPerson(
        string $id,
        GreatPersonEngine $engine,
        Request $request
    ): JsonResponse {
        $universe = Universe::find((int) $id);
        if (! $universe) {
            return response()->json(['message' => 'Universe not found'], 404);
        }
        $tick = $request->input('tick') ?? $request->query('tick');
        $tick = $tick !== null ? (int) $tick : (int) ($universe->current_tick ?? 0);
        $eval = $engine->evaluateCandidates($universe, $tick);
        $entity = $engine->spawnIfEligible($universe, $tick);
        return response()->json([
            'universe_id' => $universe->id,
            'tick' => $tick,
            'evaluation' => $eval,
            'spawned' => $entity ? [
                'id' => $entity->id,
                'name' => $entity->name,
                'entity_type' => $entity->entityType,
                'domain' => $entity->domain,
            ] : null,
        ]);
    }

    /**
     * Health/status: verify engine bindings resolve and key config is readable (Phase M optional).
     */
    public function status(): JsonResponse
    {
        $engines = [];
        $classes = [
            'TimelineSelectionEngine' => TimelineSelectionEngine::class,
            'NarrativeExtractionEngine' => NarrativeExtractionEngine::class,
            'CivilizationMemoryEngine' => CivilizationMemoryEngine::class,
            'MythologyGeneratorEngine' => MythologyGeneratorEngine::class,
            'IdeologyEvolutionEngine' => IdeologyEvolutionEngine::class,
            'GreatPersonEngine' => GreatPersonEngine::class,
        ];
        foreach ($classes as $name => $class) {
            try {
                app($class);
                $engines[$name] = true;
            } catch (\Throwable $e) {
                $engines[$name] = false;
            }
        }

        $config = [
            'scheduler.tick_budget' => config('worldos.scheduler.tick_budget'),
            'timeline_selection.default_limit' => config('worldos.timeline_selection.default_limit'),
            'narrative_extraction.default_limit' => config('worldos.narrative_extraction.default_limit'),
            'autonomic.fork_entropy_min' => config('worldos.autonomic.fork_entropy_min'),
            'pulse.run_ideology' => config('worldos.pulse.run_ideology'),
            'pulse.run_great_person' => config('worldos.pulse.run_great_person'),
        ];

        return response()->json([
            'ok' => ! in_array(false, $engines, true),
            'engines' => $engines,
            'config' => $config,
        ]);
    }
}
