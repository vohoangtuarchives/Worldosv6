<?php

declare(strict_types=1);

namespace App\Modules\Intelligence\Services\AI;

use App\Models\AiKeyPool;
use App\Modules\Intelligence\Actions\RotateKeyAction;
use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class AiProviderRouter
{
    public function __construct(
        protected AiConfigManager $configManager,
        protected AiResponseNormalizer $normalizer
    ) {
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
    public function resolveRuntimeProfile(?string $name, string $feature, array $featureProfile, string $forcedTier, callable $usesPoolFn): array
    {
        $requestedName = $name
            ?: ($featureProfile['driver'] ?? null)
            ?: $this->configManager->get('default', config('ai.default', 'local'));

        $requiredTier = $forcedTier !== 'any'
            ? $forcedTier
            : ($featureProfile['tier'] ?? 'any');
        $providerFilter = $requestedName !== 'pool'
            ? $requestedName
            : ($featureProfile['provider'] ?? null);
        $modelGroup = $featureProfile['model_group'] ?? null;
        $exactModel = $featureProfile['model'] ?? null;
        $driverOverrides = $this->normalizer->extractDriverOverrides($featureProfile);
        $defaultOptions = $this->normalizer->extractDefaultOptions($featureProfile);

        if ($requestedName === 'pool' || $usesPoolFn()) {
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
                    'model' => $driverOverrides['model'] ?? ($key->metadata['model'] ?? $this->normalizer->defaultModelForProvider($key->provider)),
                    'base_url' => $driverOverrides['url'] ?? ($key->metadata['url'] ?? $this->normalizer->defaultUrlForProvider($key->provider)),
                    'api_key' => $poolRuntime['api_key'],
                    'tier' => $key->tier,
                    'from_pool' => true,
                    'default_options' => $defaultOptions,
                    'key_entry' => $key,
                ];
            }

            throw new \RuntimeException('No available AI keys in pool for provider='.($providerFilter ?? 'any').", tier={$requiredTier}, model_group=".($modelGroup ?? 'any').', model='.($exactModel ?? 'any'));
        }

        $config = $this->resolveDriverConfig((string) $requestedName, $driverOverrides);

        return [
            'provider' => (string) $requestedName,
            'model' => $config['model'] ?? $this->normalizer->defaultModelForProvider((string) $requestedName),
            'base_url' => $config['url'] ?? $this->normalizer->defaultUrlForProvider((string) $requestedName),
            'api_key' => $config['key'] ?? null,
            'tier' => $requiredTier,
            'from_pool' => false,
            'default_options' => $defaultOptions,
            'key_entry' => null,
        ];
    }

    public function createDriver(string $name, array $overrides = []): LlmDriverInterface
    {
        $config = $this->resolveDriverConfig($name, $overrides);

        if (! $config) {
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

    public function resolveDriverConfig(string $name, array $overrides = []): array
    {
        $dbConfig = $this->configManager->get("drivers.{$name}");
        $staticConfig = config("ai.drivers.{$name}", []);
        $config = is_array($dbConfig) ? array_merge($staticConfig, $dbConfig) : $staticConfig;

        if ($overrides !== []) {
            $config = array_merge($config, $overrides);
        }

        return $config;
    }

    public function createDriverFromPoolRuntime(array $runtime, array $overrides = []): LlmDriverInterface
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

    public function resolveUsablePoolKey(
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

            if (! $key || in_array($key->id, $attemptedKeyIds, true)) {
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

    public function decryptPoolKey(AiKeyPool $key): string
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

    public function markPoolKeyAsBroken(AiKeyPool $key, \Throwable $error): void
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

    public function looksLikeEncryptedPayload(string $value): bool
    {
        $decoded = base64_decode($value, true);

        if (! is_string($decoded) || $decoded === '') {
            return false;
        }

        $payload = json_decode($decoded, true);

        return is_array($payload)
            && isset($payload['iv'], $payload['value'], $payload['mac']);
    }
}
