<?php

namespace App\Modules\Intelligence\Services\AI;

use App\Models\AiKeyPool;
use App\Modules\Intelligence\Actions\RotateKeyAction;
use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use App\Modules\Intelligence\Services\AI\Drivers;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class AiGateway
{
    protected array $drivers = [];
    protected string $forcedTier = 'any';

    public function __construct(
        protected AiConfigManager $configManager
    ) {}

    public function usesPool(): bool
    {
        return filter_var(
            $this->configManager->get('use_pool', config('ai.use_pool', false)),
            FILTER_VALIDATE_BOOL,
            FILTER_NULL_ON_FAILURE
        ) ?? false;
    }

    public function withTier(string $tier): self
    {
        $this->forcedTier = $tier;
        return $this;
    }

    public function driver(?string $name = null, string $feature = 'general', array $featureProfile = []): LlmDriverInterface
    {
        $featureProfile = $this->normalizeFeatureProfile($featureProfile);
        $runtime = $this->resolveRuntimeProfile($name, $feature, $featureProfile);
        $driverOverrides = $this->extractDriverOverrides($featureProfile);
        $defaultOptions = $runtime['default_options'] ?? [];

        if (($runtime['from_pool'] ?? false) === true && isset($runtime['key_entry']) && $runtime['key_entry'] instanceof AiKeyPool) {
            $driver = $this->createDriverFromPoolRuntime($runtime, $driverOverrides);
            return new AiDriverProxy(
                $driver,
                (string) $runtime['provider'],
                $feature,
                $runtime['key_entry'],
                $defaultOptions
            );
        }

        $requestedName = (string) $runtime['provider'];

        if ($driverOverrides === []) {
            if (!isset($this->drivers[$requestedName])) {
                $this->drivers[$requestedName] = $this->createDriver($requestedName);
            }

            return new AiDriverProxy($this->drivers[$requestedName], $requestedName, $feature, null, $defaultOptions);
        }

        return new AiDriverProxy(
            $this->createDriver($requestedName, $driverOverrides),
            $requestedName,
            $feature,
            null,
            $defaultOptions
        );
    }

    public function getActiveKey(?string $tier = 'any', ?string $provider = null, ?string $modelGroup = null, ?string $model = null): ?array
    {
        $poolRuntime = $this->resolveUsablePoolKey(
            $tier ?: 'any',
            $provider,
            $modelGroup,
            $model
        );

        if (!$poolRuntime) {
            return null;
        }

        $key = $poolRuntime['key'];
        $apiKey = $poolRuntime['api_key'];

        return [
            'id' => $key->id,
            'provider' => $key->provider,
            'api_key' => $apiKey,
            'base_url' => $key->metadata['url'] ?? null,
            'model' => $key->metadata['model'] ?? null,
            'tier' => $key->tier,
            'entry' => $key,
        ];
    }

    public function getActiveKeyForFeature(string $feature, array $overrides = []): ?array
    {
        $config = $this->configManager->get(
            "features.{$feature}",
            config("ai.features.{$feature}", config('ai.default', 'local'))
        );
        $profile = array_merge($this->normalizeFeatureProfile($config), $this->normalizeFeatureProfile($overrides));
        $configuredDriver = is_string($config) ? trim($config) : null;
        $requestedName = $profile['driver']
            ?? ($configuredDriver !== '' ? $configuredDriver : null)
            ?? $this->configManager->get('default', config('ai.default', 'local'));
        $providerFilter = $requestedName !== 'pool'
            ? $requestedName
            : ($profile['provider'] ?? null);

        return $this->getActiveKey(
            $profile['tier'] ?? 'any',
            $providerFilter,
            $profile['model_group'] ?? null,
            $profile['model'] ?? null
        );
    }

    /**
     * Resolve the runtime connection profile that should be used for a feature.
     *
     * @return array{
     *   provider:string,
     *   model:?string,
     *   base_url:?string,
     *   api_key:?string,
     *   tier:string,
     *   from_pool:bool,
     *   default_options:array<string,mixed>,
     *   key_entry:?AiKeyPool
     * }
     */
    public function runtimeProfile(?string $name = null, string $feature = 'general', array $featureProfile = []): array
    {
        return $this->resolveRuntimeProfile($name, $feature, $this->normalizeFeatureProfile($featureProfile));
    }

    public function runtimeProfileForFeature(string $feature, array $overrides = []): array
    {
        $config = $this->configManager->get(
            "features.{$feature}",
            config("ai.features.{$feature}", config('ai.default', 'local'))
        );
        $profile = array_merge($this->normalizeFeatureProfile($config), $this->normalizeFeatureProfile($overrides));
        $driverName = $profile['driver'] ?? (is_string($config) ? trim($config) : null);

        return $this->runtimeProfile($driverName, $feature, $profile);
    }

    public function feature(string $name): LlmDriverInterface
    {
        $config = $this->configManager->get("features.{$name}", config("ai.features.{$name}", config('ai.default', 'local')));
        $profile = $this->normalizeFeatureProfile($config);
        $driverName = $profile['driver'] ?? (is_string($config) ? $config : null);

        return $this->driver($driverName, $name, $profile);
    }

    public function chat(array $messages, array $options = []): ?string
    {
        return $this->driver()->chat($messages, $options);
    }

    protected function resolveRuntimeProfile(?string $name, string $feature, array $featureProfile): array
    {
        $requestedName = $name
            ?: ($featureProfile['driver'] ?? null)
            ?: $this->configManager->get('default', config('ai.default', 'local'));

        $requiredTier = $this->forcedTier !== 'any'
            ? $this->forcedTier
            : ($featureProfile['tier'] ?? 'any');
        $providerFilter = $requestedName !== 'pool'
            ? $requestedName
            : ($featureProfile['provider'] ?? null);
        $modelGroup = $featureProfile['model_group'] ?? null;
        $exactModel = $featureProfile['model'] ?? null;
        $driverOverrides = $this->extractDriverOverrides($featureProfile);
        $defaultOptions = $this->extractDefaultOptions($featureProfile);

        if ($requestedName === 'pool' || $this->usesPool()) {
            $poolRuntime = $this->resolveUsablePoolKey(
                $requiredTier,
                $providerFilter,
                $modelGroup,
                $exactModel
            );

            if ($poolRuntime) {
                $key = $poolRuntime['key'];

                return [
                    'provider' => $key->provider,
                    'model' => $driverOverrides['model'] ?? ($key->metadata['model'] ?? $this->defaultModelForProvider($key->provider)),
                    'base_url' => $driverOverrides['url'] ?? ($key->metadata['url'] ?? $this->defaultUrlForProvider($key->provider)),
                    'api_key' => $poolRuntime['api_key'],
                    'tier' => $key->tier,
                    'from_pool' => true,
                    'default_options' => $defaultOptions,
                    'key_entry' => $key,
                ];
            }

            throw new \RuntimeException("No available AI keys in pool for provider=" . ($providerFilter ?? 'any') . ", tier={$requiredTier}, model_group=" . ($modelGroup ?? 'any') . ", model=" . ($exactModel ?? 'any'));
        }

        $config = $this->resolveDriverConfig((string) $requestedName, $driverOverrides);

        return [
            'provider' => (string) $requestedName,
            'model' => $config['model'] ?? $this->defaultModelForProvider((string) $requestedName),
            'base_url' => $config['url'] ?? $this->defaultUrlForProvider((string) $requestedName),
            'api_key' => $config['key'] ?? null,
            'tier' => $requiredTier,
            'from_pool' => false,
            'default_options' => $defaultOptions,
            'key_entry' => null,
        ];
    }

    protected function createDriver(string $name, array $overrides = []): LlmDriverInterface
    {
        $config = $this->resolveDriverConfig($name, $overrides);

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
            'gemini' => new Drivers\OpenAiDriver(
                $config['url'] ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
                $config['key'] ?? '',
                $config['model'] ?? 'gemini-1.5-flash'
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

    protected function resolveDriverConfig(string $name, array $overrides = []): array
    {
        $dbConfig = $this->configManager->get("drivers.{$name}");
        $staticConfig = config("ai.drivers.{$name}", []);
        $config = is_array($dbConfig) ? array_merge($staticConfig, $dbConfig) : $staticConfig;

        if ($overrides !== []) {
            $config = array_merge($config, $overrides);
        }

        return $config;
    }

    protected function createDriverFromPoolRuntime(array $runtime, array $overrides = []): LlmDriverInterface
    {
        /** @var AiKeyPool $key */
        $key = $runtime['key_entry'];
        $apiKey = (string) ($runtime['api_key'] ?? '');
        $baseUrl = $overrides['url'] ?? ($runtime['base_url'] ?? ($key->metadata['url'] ?? null));
        $model = $overrides['model'] ?? ($runtime['model'] ?? ($key->metadata['model'] ?? null));

        return match ($key->provider) {
            'zai' => new Drivers\ZaiDriver(
                $baseUrl ?? 'https://api.z.ai/api/paas/v4/chat/completions',
                $apiKey,
                $model ?? 'GLM-4.5-Flash'
            ),
            'openai' => new Drivers\OpenAiDriver(
                $baseUrl ?? 'https://api.openai.com/v1/chat/completions',
                $apiKey,
                $model ?? 'gpt-4o'
            ),
            'gemini' => new Drivers\OpenAiDriver(
                $baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
                $apiKey,
                $model ?? 'gemini-1.5-flash'
            ),
            'openrouter' => new Drivers\OpenRouterDriver(
                $baseUrl ?? 'https://openrouter.ai/api/v1/chat/completions',
                $apiKey,
                $model ?? 'google/gemini-2.0-flash-001'
            ),
            'local' => new Drivers\LocalDriver(
                $baseUrl ?? 'http://host.docker.internal:11434/v1/chat/completions',
                $model ?? 'qwen2.5:7b'
            ),
            default => new Drivers\OpenAiDriver(
                $baseUrl ?? '',
                $apiKey,
                $model ?? ''
            ),
        };
    }

    protected function resolveUsablePoolKey(
        string $requiredTier = 'any',
        ?string $provider = null,
        ?string $modelGroup = null,
        ?string $model = null
    ): ?array {
        $attemptedKeyIds = [];

        while (true) {
            /** @var RotateKeyAction $rotator */
            $rotator = app(RotateKeyAction::class);
            $key = $rotator->handle($requiredTier, $provider, $modelGroup, $model);

            if (!$key || in_array($key->id, $attemptedKeyIds, true)) {
                return null;
            }

            try {
                return [
                    'key' => $key,
                    'api_key' => $this->decryptPoolKey($key),
                ];
            } catch (\RuntimeException) {
                $attemptedKeyIds[] = $key->id;
            }
        }
    }

    protected function decryptPoolKey(AiKeyPool $key): string
    {
        $apiKey = (string) ($key->getRawOriginal('key_encrypted') ?? $key->key_encrypted ?? '');

        if ($apiKey === '') {
            return '';
        }

        try {
            if ($this->looksLikeEncryptedPayload($apiKey)) {
                $apiKey = Crypt::decryptString($apiKey);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to decrypt AI Key ID: {$key->id}: {$e->getMessage()}");
            $this->markPoolKeyAsBroken($key, $e);
            throw new \RuntimeException("AI pool key #{$key->id} could not be decrypted.", 0, $e);
        }

        return $apiKey;
    }

    protected function markPoolKeyAsBroken(AiKeyPool $key, \Throwable $error): void
    {
        try {
            $metadata = is_array($key->metadata) ? $key->metadata : [];
            $metadata['last_error'] = 'decrypt_failed';
            $metadata['last_error_message'] = $error->getMessage();
            $metadata['last_error_at'] = now()->toIso8601String();

            $key->status = 'inactive';
            $key->cooldown_until = null;
            $key->metadata = $metadata;
            $key->save();
        } catch (\Throwable $persistError) {
            Log::warning("Failed to quarantine broken AI Key ID: {$key->id}: {$persistError->getMessage()}");
        }
    }

    protected function looksLikeEncryptedPayload(string $value): bool
    {
        $decoded = base64_decode($value, true);

        if (!is_string($decoded) || $decoded === '') {
            return false;
        }

        $payload = json_decode($decoded, true);

        return is_array($payload)
            && isset($payload['iv'], $payload['value'], $payload['mac']);
    }

    protected function normalizeFeatureProfile(mixed $config): array
    {
        if (is_string($config) && trim($config) !== '') {
            return ['driver' => trim($config)];
        }

        if (!is_array($config)) {
            return [];
        }

        $profile = [];

        foreach (['driver', 'provider', 'model', 'model_group', 'tier'] as $key) {
            if (isset($config[$key]) && is_string($config[$key]) && trim($config[$key]) !== '') {
                $profile[$key] = trim($config[$key]);
            }
        }

        foreach (['max_tokens', 'timeout'] as $key) {
            if (isset($config[$key]) && is_numeric($config[$key])) {
                $profile[$key] = (int) $config[$key];
            }
        }

        foreach (['temperature', 'top_p'] as $key) {
            if (isset($config[$key]) && is_numeric($config[$key])) {
                $profile[$key] = (float) $config[$key];
            }
        }

        return $profile;
    }

    protected function extractDriverOverrides(array $featureProfile): array
    {
        $overrides = [];

        foreach (['url', 'key', 'model'] as $key) {
            if (isset($featureProfile[$key]) && $featureProfile[$key] !== '') {
                $overrides[$key] = $featureProfile[$key];
            }
        }

        return $overrides;
    }

    protected function extractDefaultOptions(array $featureProfile): array
    {
        $defaults = [];

        foreach (['max_tokens', 'temperature', 'timeout', 'top_p'] as $key) {
            if (isset($featureProfile[$key]) && $featureProfile[$key] !== '') {
                $defaults[$key] = $featureProfile[$key];
            }
        }

        return $defaults;
    }

    protected function defaultUrlForProvider(string $provider): ?string
    {
        return match ($provider) {
            'zai' => 'https://api.z.ai/api/paas/v4/chat/completions',
            'openai' => 'https://api.openai.com/v1/chat/completions',
            'gemini' => 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            'openrouter' => 'https://openrouter.ai/api/v1/chat/completions',
            'local' => 'http://host.docker.internal:11434/v1/chat/completions',
            'qwen' => 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            default => null,
        };
    }

    protected function defaultModelForProvider(string $provider): ?string
    {
        return match ($provider) {
            'zai' => 'GLM-4.5-Flash',
            'openai' => 'gpt-4o',
            'gemini' => 'gemini-1.5-flash',
            'openrouter' => 'google/gemini-2.0-flash-001',
            'local' => 'qwen2.5:7b',
            'qwen' => 'qwen-max',
            default => null,
        };
    }
}
