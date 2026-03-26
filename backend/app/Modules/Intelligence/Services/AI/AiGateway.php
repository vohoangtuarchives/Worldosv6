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

    public function __construct(
        protected AiConfigManager $configManager
    ) {}

    /**
     * Get a driver instance by name.
     */
    public function driver(?string $name = null, string $feature = 'general'): LlmDriverInterface
    {
        $name = $name ?: $this->configManager->get('default', config('ai.default', 'local'));

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
        } else {
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
            default => throw new \InvalidArgumentException("AI Driver [{$name}] not supported."),
        };
    }

}
