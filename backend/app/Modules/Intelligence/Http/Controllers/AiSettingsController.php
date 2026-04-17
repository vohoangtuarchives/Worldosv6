<?php

namespace App\Modules\Intelligence\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AiSetting;
use App\Modules\Intelligence\Services\AI\AiConfigManager;
use Illuminate\Http\Request;

class AiSettingsController extends Controller
{
    public function __construct(
        protected AiConfigManager $configManager
    ) {}

    /**
     * List pool-first settings only. Legacy fixed driver credentials are hidden.
     */
    public function index()
    {
        $settings = AiSetting::query()
            ->where('key', 'not like', 'drivers.%')
            ->get()
            ->map(function (AiSetting $setting) {
                $value = $this->decodeValue($setting->value);

                if ($setting->is_secret && $value !== null && $value !== '') {
                    $value = $this->maskSecrets($value);
                }

                return [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'value' => $value,
                    'group' => $setting->group,
                    'description' => $setting->description,
                    'is_secret' => $setting->is_secret,
                    'created_at' => $setting->created_at,
                    'updated_at' => $setting->updated_at,
                ];
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

        $key = (string) $request->input('key');

        if (str_starts_with($key, 'drivers.')) {
            return response()->json([
                'message' => 'Legacy fixed driver credentials are disabled. Please manage providers through AI Key Pool.',
            ], 422);
        }

        $value = $request->input('value');
        $existing = AiSetting::where('key', $key)->first();
        $treatAsSecret = (bool) ($request->input('is_secret', $existing?->is_secret ?? false));

        if ($key === 'use_pool') {
            $value = true;
        }

        if ($existing && $treatAsSecret) {
            $existingValue = $this->decodeValue($existing->value);

            if ($value === '********') {
                $value = $existingValue ?? $existing->value;
            } elseif (is_array($value)) {
                $value = $this->restoreMaskedSecrets(
                    $value,
                    is_array($existingValue) ? $existingValue : []
                );
            }
        }

        $this->configManager->set(
            $key,
            $value,
            $request->input('group'),
            $request->input('description'),
            $treatAsSecret
        );

        $this->purgeLegacyDriverSettings();

        return response()->json(['message' => 'Cập nhật cấu hình AI thành công.']);
    }

    /**
     * Force sync cache and remove legacy driver credentials from cache.
     */
    public function sync()
    {
        $this->purgeLegacyDriverSettings(sync: false);
        $this->configManager->syncToCache();

        return response()->json(['message' => 'Đã đồng bộ cache AI thành công.']);
    }

    /**
     * Seed pool-first defaults from config/ai.php.
     */
    public function import()
    {
        $config = config('ai');

        $this->configManager->set('default', 'pool', 'general', 'Điểm vào mặc định cho AI Pool');
        $this->configManager->set('use_pool', true, 'general', 'Luôn bật AI key pool');

        foreach ($config['features'] ?? [] as $feature => $driver) {
            $this->configManager->set("features.{$feature}", $driver, 'feature', "Hệ thống mapping cho {$feature}");
        }

        $this->purgeLegacyDriverSettings();

        return response()->json(['message' => 'Đã nhập cấu hình pool-first từ file thành công.']);
    }

    /**
     * Get list of supported provider filters for pool routing.
     */
    public function drivers()
    {
        return response()->json(array_values(array_unique(['pool', ...array_keys(config('ai.drivers', []))])));
    }

    /**
     * Get Loom agents configuration.
     */
    public function loomAgents()
    {
        $agents = AiSetting::query()
            ->where('key', 'like', 'loom_agents.%')
            ->get()
            ->map(function (AiSetting $setting) {
                $value = $this->decodeValue($setting->value);

                return [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'agent_name' => str_replace('loom_agents.', '', $setting->key),
                    'value' => $value,
                    'group' => $setting->group,
                    'description' => $setting->description,
                    'created_at' => $setting->created_at,
                    'updated_at' => $setting->updated_at,
                ];
            });

        return response()->json($agents);
    }

    /**
     * Import Loom agents configuration from JSON file.
     */
    public function importLoomAgents()
    {
        $jsonPath = base_path('agent_routing.json');

        if (!file_exists($jsonPath)) {
            return response()->json(['message' => 'File agent_routing.json không tồn tại tại: ' . $jsonPath], 404);
        }

        $config = json_decode(file_get_contents($jsonPath), true);

        if (!is_array($config)) {
            return response()->json(['message' => 'Không thể đọc file JSON'], 500);
        }

        foreach ($config as $agentName => $agentConfig) {
            $key = "loom_agents.{$agentName}";
            $value = json_encode($agentConfig);

            AiSetting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'group' => 'loom_agents',
                    'description' => "Cấu hình AI cho Loom agent: {$agentName}",
                    'is_secret' => false,
                ]
            );
        }

        $this->configManager->syncToCache();

        return response()->json(['message' => 'Đã nhập cấu hình Loom agents từ file JSON thành công.']);
    }

    private function purgeLegacyDriverSettings(bool $sync = true): void
    {
        AiSetting::query()->where('key', 'like', 'drivers.%')->delete();

        if ($sync) {
            $this->configManager->syncToCache();
        }
    }

    private function decodeValue(mixed $value): mixed
    {
        if (!is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return $value;
        }

        if ($trimmed[0] === '{' || $trimmed[0] === '[') {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        if (in_array(strtolower($trimmed), ['true', 'false'], true)) {
            return strtolower($trimmed) === 'true';
        }

        if (is_numeric($trimmed) && !str_contains($trimmed, ' ')) {
            return str_contains($trimmed, '.') ? (float) $trimmed : (int) $trimmed;
        }

        return $value;
    }

    private function maskSecrets(mixed $value): mixed
    {
        if (is_array($value)) {
            $masked = [];
            foreach ($value as $key => $item) {
                $masked[$key] = $this->isSecretField((string) $key)
                    ? '********'
                    : $this->maskSecrets($item);
            }

            return $masked;
        }

        return '********';
    }

    private function restoreMaskedSecrets(array $incoming, array $existing): array
    {
        $merged = $incoming;

        foreach ($incoming as $key => $value) {
            if ($value === '********' && array_key_exists($key, $existing)) {
                $merged[$key] = $existing[$key];
                continue;
            }

            if (is_array($value)) {
                $merged[$key] = $this->restoreMaskedSecrets(
                    $value,
                    is_array($existing[$key] ?? null) ? $existing[$key] : []
                );
            }
        }

        foreach ($existing as $key => $value) {
            if (!array_key_exists($key, $merged) && $this->isSecretField((string) $key)) {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }

    private function isSecretField(string $key): bool
    {
        return in_array(strtolower($key), ['key', 'api_key', 'token', 'secret', 'password'], true);
    }
}
