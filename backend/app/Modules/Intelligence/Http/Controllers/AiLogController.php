<?php

namespace App\Modules\Intelligence\Http\Controllers;

use App\Models\AiLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AiLogController extends Controller
{
    /**
     * List AI interaction logs with pagination.
     */
    public function index(Request $request)
    {
        $query = AiLog::query();

        // Filters
        if ($request->has('feature')) {
            $query->where('feature', $request->feature);
        }
        if ($request->has('driver')) {
            $query->where('driver', $request->driver);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('limit', 50));

        return response()->json($logs);
    }

    /**
     * Get a specific log entry.
     */
    public function show($id)
    {
        $log = AiLog::findOrFail($id);
        return response()->json($log);
    }

    /**
     * Clear all logs (Admin function).
     */
    public function clear()
    {
        AiLog::truncate();
        return response()->json(['message' => 'Toàn bộ nhật ký AI đã được xóa.']);
    }
}
