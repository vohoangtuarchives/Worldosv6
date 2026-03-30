<?php

namespace App\Modules\WorldOS\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiKeyPool;
use App\Models\AiSetting;
use App\Modules\WorldOS\Services\KeyRotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class AiConfigController extends Controller
{
    public function __construct(
        private KeyRotationService $rotationService
    ) {}

    /**
     * Liệt kê các Key hiện có (đã che giấu nội dung bạy cảm).
     */
    public function listKeys(): JsonResponse
    {
        $keys = AiKeyPool::all()->map(function ($key) {
            return [
                'id' => $key->id,
                'provider' => $key->provider,
                'label' => $key->label,
                'model_group' => $key->model_group,
                'is_free' => $key->is_free,
                'usage_count' => $key->usage_count,
                'status' => $key->status,
                'last_used_at' => $key->last_used_at?->toIso8601String(),
                'cooldown_until' => $key->cooldown_until?->toIso8601String(),
                'key_preview' => '********' . substr($key->key_encrypted, -4),
            ];
        });

        return response()->json(['data' => $keys]);
    }

    /**
     * Nạp Key mới vào hệ thống.
     */
    public function storeKey(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => 'required|string',
            'api_key' => 'required|string',
            'label' => 'nullable|string',
            'is_free' => 'boolean',
        ]);

        $this->rotationService->registerKey(
            $request->provider,
            $request->api_key,
            $request->boolean('is_free', true),
            $request->label
        );

        return response()->json(['message' => 'Key registered successfully.'], 201);
    }

    /**
     * Xóa một Key khỏi bể chứa.
     */
    public function destroyKey(int $id): JsonResponse
    {
        $key = AiKeyPool::findOrFail($id);
        $key->delete();

        return response()->json(['message' => 'Key removed.']);
    }

    /**
     * Lấy các cấu hình AI tổng quát (Narrative Style, Agent Routing).
     */
    public function getSettings(): JsonResponse
    {
        $settings = AiSetting::whereIn('key', [
            'narrative.style',
            'agent.routing',
            'sim.tick_rate'
        ])->get()->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }

    /**
     * Cập nhật cấu hình AI.
     */
    public function updateSetting(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required',
        ]);

        AiSetting::updateOrCreate(
            ['key' => $request->key],
            ['value' => is_array($request->value) ? json_encode($request->value) : $request->value]
        );

        return response()->json(['message' => 'Setting updated.']);
    }
}
