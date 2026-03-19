<?php

namespace App\Modules\Simulation\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VocationLibraryController extends Controller
{
    /**
     * Get all vocation definitions and their 8D motivation profiles.
     */
    public function index(): JsonResponse
    {
        $vocations = DB::table('vocation_definitions')
            ->orderBy('min_tier')
            ->orderBy('name')
            ->get();

        $formatted = $vocations->map(function ($v) {
            return [
                'id' => $v->id,
                'name' => $v->name,
                'min_tier' => (int)$v->min_tier,
                'tags' => json_decode($v->tags),
                'motivation_profile' => json_decode($v->motivation_profile, true),
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

        $v = (array)$vocation;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $v['id'],
                'name' => $v['name'],
                'min_tier' => (int)$v['min_tier'],
                'tags' => json_decode($v['tags']),
                'motivation_profile' => json_decode($v['motivation_profile'], true),
            ]
        ]);
    }
}
