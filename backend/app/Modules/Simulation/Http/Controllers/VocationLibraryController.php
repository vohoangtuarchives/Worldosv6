<?php

namespace App\Modules\Simulation\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class VocationLibraryController extends Controller
{
    /**
     * Get all vocation definitions and their 8D motivation profiles.
     */
    public function index(): JsonResponse
    {
        $path = app_path('Modules/Simulation/Data/vocations.json');
        $jsonVocations = File::exists($path) ? json_decode(File::get($path), true)['vocations'] : [];
        $vocationMap = collect($jsonVocations)->keyBy('id');

        $dbVocations = DB::table('vocation_definitions')
            ->orderBy('min_tier')
            ->orderBy('name')
            ->get();

        $formatted = $dbVocations->map(function ($v) use ($vocationMap) {
            $jsonExtra = $vocationMap->get($v->id, []);
            
            return [
                'id' => $v->id,
                'name' => $v->name,
                'min_tier' => (int)$v->min_tier,
                'tags' => json_decode($v->tags),
                'motivation_profile' => json_decode($v->motivation_profile, true),
                // Rich data from JSON
                'base_stats' => $jsonExtra['base_stats'] ?? null,
                'requirements' => $jsonExtra['requirements'] ?? null,
                'evolves_to' => $jsonExtra['evolves_to'] ?? [],
                'skills' => $jsonExtra['skills'] ?? [],
                'description' => $jsonExtra['description'] ?? 'No scroll found for this destiny.',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted
        ]);
    }

    /**
     * Get a single vocation by ID.
     */
    public function show(string $id): JsonResponse
    {
        $vocation = DB::table('vocation_definitions')->where('id', $id)->first();

        if (!$vocation) {
            return response()->json(['success' => false, 'message' => 'Vocation not found'], 404);
        }

        $path = app_path('Modules/Simulation/Data/vocations.json');
        $jsonVocations = File::exists($path) ? json_decode(File::get($path), true)['vocations'] : [];
        $jsonExtra = collect($jsonVocations)->firstWhere('id', $id);

        $v = (array)$vocation;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $v['id'],
                'name' => $v['name'],
                'min_tier' => (int)$v['min_tier'],
                'tags' => json_decode($v['tags']),
                'motivation_profile' => json_decode($v['motivation_profile'], true),
                // Rich data from JSON
                'base_stats' => $jsonExtra['base_stats'] ?? null,
                'requirements' => $jsonExtra['requirements'] ?? null,
                'evolves_to' => $jsonExtra['evolves_to'] ?? [],
                'skills' => $jsonExtra['skills'] ?? [],
                'description' => $jsonExtra['description'] ?? 'No scroll found for this destiny.',
            ]
        ]);
    }
}
