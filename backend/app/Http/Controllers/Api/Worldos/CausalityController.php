<?php

namespace App\Http\Controllers\Api\Worldos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Universe;
use App\Simulation\Services\CausalExportService;

class CausalityController extends Controller
{
    /**
     * Export the causal graph for a specific universe.
     * GET /api/worldos/universes/{id}/causality/export
     */
    public function exportGraph(string $id, Request $request, CausalExportService $exportService)
    {
        $universe = Universe::findOrFail((int) $id);
        $limit  = (int) $request->query('limit', 100);
        $cursor = $request->has('cursor') ? (int) $request->query('cursor') : null;
        
        $graphData = $exportService->exportForUniverse($universe, $limit, $cursor);
        
        return response()->json($graphData);
    }
}
