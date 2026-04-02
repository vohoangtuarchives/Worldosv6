<?php

namespace App\Modules\Intelligence\Services\AI;

use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use App\Modules\Intelligence\Services\AI\Drivers\ZaiDriver;
use App\Modules\Intelligence\Services\AI\Drivers\OpenAiDriver;
use App\Modules\Intelligence\Services\AI\Drivers;
use Illuminate\Support\Facades\Log;

class AiGateway
{
    protected array $drivers = [];
    protected string $forcedTier = 'any';

    public function __construct(protected
        AiConfigManager $configManager
        )
    {
    }

    /**
     * Chỉ định Tier yêu cầu cho lần gọi driver tiếp theo.
     */
    public function withTier(string $tier): self
    {
        $this->forcedTier = $tier;
        return $this;
    }

    /**
     * Get a driver instance by name.
     */
    public function driver(?string $name = null, string $feature = 'general'): LlmDriverInterface
    {
        $name = $name ?: $this->configManager->get('default', config('ai.default', 'local'));

        // Kiểm tra xem có sử dụng Key Pool hay không
        // Ưu tiên nếu name là 'pool' hoặc được cấu hình toàn cục
        if ($name === 'pool' || config('ai.use_pool', false)) {
            $key = app(\App\Modules\Intelligence\Actions\RotateKeyAction::class)->handle(
                $this->forcedTier,
                ($name !== 'pool') ? $name : null
            );

            if ($key) {
                $driver = $this->createDriverFromKey($key);
                return new AiDriverProxy($driver, $key->provider, $feature, $key);
            }

            // Nếu không tìm thấy key trong pool, fallback về config tĩnh (nếu name không phải 'pool')
            if ($name === 'pool') {
                throw new \RuntimeException("No available AI keys in pool for tier: {$this->forcedTier}");
            }
        }

        if (!isset($this->drivers[$name])) {
            $this->drivers[$name] = $this->createDriver($name);
        }

        return new AiDriverProxy($this->drivers[$name], $name, $feature);
    }

    /**
     * Get a driver instance by feature name mapping.
     */
    public function feature(string $name): LlmDriverInterface
    {
        $driverName = $this->configManager->get("features.{$name}", config("ai.features.{$name}", config('ai.default', 'local')));
        return $this->driver($driverName, $name);
    }


    /**
     * Proxy chat call to default driver.
     */
    public function chat(array $messages, array $options = []): ?string
    {
        return $this->driver()->chat($messages, $options);
    }

    protected function createDriver(string $name): LlmDriverInterface
    {
        // Merge DB config with static config (DB overrides static)
        $dbConfig = $this->configManager->get("drivers.{$name}");
        $staticConfig = config("ai.drivers.{$name}", []);

        if (is_array($dbConfig)) {
            $config = array_merge($staticConfig, $dbConfig);
        }
        else {
            $config = $staticConfig;
        }

        if (!$config) {
            throw new \InvalidArgumentException("AI Driver [{$name}] not configured.");
        }

        return match ($name) {
                'zai' => new Drivers\ZaiDriver(
                $config['url'] ?? '',
                $config['key'] ?? '',
                $config['model'] ?? ''
            ),
                'openai' => new Drivers\OpenAiDriver(
                $config['url'] ?? '',
                $config['key'] ?? '',
                $config['model'] ?? ''
            ),
                'local' => new Drivers\LocalDriver(
                $config['url'] ?? '',
                $config['model'] ?? ''
            ),
                'openrouter' => new Drivers\OpenRouterDriver(
                $config['url'] ?? 'https://openrouter.ai/api/v1/chat/completions',
                $config['key'] ?? '',
                $config['model'] ?? 'minimax/minimax-m2.5:free'
            ),
                'qwen' => new Drivers\LocalDriver(
                $config['url'] ?? 'http://host.docker.internal:8080/v1/chat/completions',
                $config['model'] ?? 'qwen3-14b-uncensored'
            ),
                default => throw new \InvalidArgumentException("AI Driver [{$name}] not supported."),
            };
    }

    /**
     * Tạo driver instance từ thông tin key trong Pool.
     */
    protected function createDriverFromKey(\App\Models\AiKeyPool $key): LlmDriverInterface
    {
        // Giải mã key nếu cần (giả sử dùng Crypt mặc định của Laravel)
        $apiKey = $key->key_encrypted;
        try {
            if (str_contains($apiKey, ':')) { // Kiểm tra định dạng mã hóa cơ bản
                $apiKey = \Illuminate\Support\Facades\Crypt::decryptString($apiKey);
            }
        } catch (\Throwable $e) {
            // Nếu không decrypt được, coi như key thô (hoặc log lỗi)
            Log::error("Failed to decrypt AI Key ID: {$key->id}");
        }

        return match ($key->provider) {
            'openai' => new Drivers\OpenAiDriver(
                $key->metadata['url'] ?? 'https://api.openai.com/v1/chat/completions',
                $apiKey,
                $key->metadata['model'] ?? 'gpt-3.5-turbo'
            ),
            'gemini' => new Drivers\OpenAiDriver(
                $key->metadata['url'] ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
                $apiKey,
                $key->metadata['model'] ?? 'gemini-1.5-flash'
            ),
            'openrouter' => new Drivers\OpenRouterDriver(
                $key->metadata['url'] ?? 'https://openrouter.ai/api/v1/chat/completions',
                $apiKey,
                $key->metadata['model'] ?? 'minimax/minimax-m2.5:free'
            ),
            default => throw new \InvalidArgumentException("Provider [{$key->provider}] from pool not supported."),
        };
    }

}
