<?php

namespace App\Modules\Intelligence\Http\Controllers;

use App\Models\AiSetting;
use App\Modules\Intelligence\Services\AI\AiConfigManager;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AiSettingsController extends Controller
{
    public function __construct(
        protected AiConfigManager $configManager
    ) {}

    /**
     * List all settings.
     */
    public function index()
    {
        $settings = AiSetting::all()->map(function ($s) {
            // Hide secret values in general listing if needed
            if ($s->is_secret && $s->value) {
                $s->value = '********';
            }
            return $s;
        });

        return response()->json($settings);
    }

    /**
     * Update or create a setting.
     */
    public function update(Request $request)
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'nullable',
            'group' => 'nullable|string',
            'is_secret' => 'nullable|boolean',
        ]);

        $value = $request->value;
        
        // Safety: If value is masked (********), do NOT overwrite the existing secret
        if ($value === '********') {
            $existing = AiSetting::where('key', $request->key)->first();
            if ($existing && $existing->is_secret) {
                $value = $existing->value;
            }
        }

        $this->configManager->set(
            $request->key,
            $value,
            $request->group,
            $request->description,
            $request->is_secret ?? false
        );

        return response()->json(['message' => 'Cập nhật cấu hình AI thành công.']);
    }

    /**
     * Force sync cache.
     */
    public function sync()
    {
        $this->configManager->syncToCache();
        return response()->json(['message' => 'Đã đồng bộ Cache AI thành công.']);
    }

    /**
     * Seed from config/ai.php.
     */
    public function import()
    {
        $config = config('ai');
        
        // Default
        $this->configManager->set('default', $config['default'], 'general', 'Driver AI mặc định');

        // Features
        foreach ($config['features'] ?? [] as $feature => $driver) {
            $this->configManager->set("features.{$feature}", $driver, 'feature', "Hệ thống mapping cho {$feature}");
        }

        // Drivers
        foreach ($config['drivers'] ?? [] as $driver => $data) {
            $this->configManager->set("drivers.{$driver}", $data, 'provider', "Cấu hình cho driver {$driver}", true);
        }

        // Narrative Throttling (WorldOS Config)
        $this->configManager->set('narrative.min_tick_interval', $config['narrative']['min_tick_interval'] ?? 10, 'general', 'Số tick tối thiểu giữa các lần AI Narrative xử lý');
        $this->configManager->set('narrative.delta_threshold', $config['narrative']['delta_threshold'] ?? 0.1, 'general', 'Ngưỡng thay đổi Entropy/Stability để kích hoạt AI');

        return response()->json(['message' => 'Đã nhập cấu hình từ file thành công.']);
    }

    /**
     * Get list of available drivers from config.
     */
    public function drivers()
    {
        $drivers = array_keys(config('ai.drivers', []));
        return response()->json($drivers);
    }
}
