<?php

namespace App\Modules\Intelligence\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AiKeyPool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class AiKeyPoolController extends Controller
{
    public function index()
    {
        return response()->json(AiKeyPool::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'label' => 'required|string',
            'key' => 'required|string',
            'tier' => 'required|in:free,premium',
            'level' => 'integer|min:1',
            'model_group' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $key = new AiKeyPool($validated);
        $key->is_free = ($request->tier === 'free');
        $key->key_encrypted = Crypt::encryptString($request->key);
        $key->status = 'active';
        $key->save();

        return response()->json($key, 201);
    }

    public function update(Request $request, AiKeyPool $key)
    {
        $validated = $request->validate([
            'label' => 'string',
            'status' => 'in:active,inactive,cooldown',
            'tier' => 'in:free,premium',
            'level' => 'integer|min:1',
            'metadata' => 'array',
        ]);

        if ($request->has('key')) {
            $validated['key_encrypted'] = Crypt::encryptString($request->key);
        }

        $key->update($validated);

        return response()->json($key);
    }

    public function destroy(AiKeyPool $key)
    {
        $key->delete();
        return response()->json(null, 204);
    }
}
