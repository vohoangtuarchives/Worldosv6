<?php

namespace App\Modules\Intelligence\Services\AI;

use App\Models\AiKeyPool;
use App\Modules\Intelligence\Contracts\LlmDriverInterface;

class AiGateway
{
    protected array $drivers = [];

    protected string $forcedTier = 'any';

    public function __construct(
        protected AiConfigManager $configManager,
        protected ?AiProviderRouter $router = null,
        protected ?AiResponseNormalizer $normalizer = null
    ) {
        $this->normalizer = $normalizer ?? new AiResponseNormalizer();
        $this->router = $router ?? new AiProviderRouter($this->configManager, $this->normalizer);
    }

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
        $featureProfile = $this->normalizer->normalizeFeatureProfile($featureProfile);
        $runtime = $this->router->resolveRuntimeProfile($name, $feature, $featureProfile, $this->forcedTier, fn () => $this->usesPool());
        $driverOverrides = $this->normalizer->extractDriverOverrides($featureProfile);
        $defaultOptions = $runtime['default_options'] ?? [];

        if (($runtime['from_pool'] ?? false) === true && isset($runtime['key_entry']) && $runtime['key_entry'] instanceof AiKeyPool) {
            $driver = $this->router->createDriverFromPoolRuntime($runtime, $driverOverrides);

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
            if (! isset($this->drivers[$requestedName])) {
                $this->drivers[$requestedName] = $this->router->createDriver($requestedName);
            }

            return new AiDriverProxy($this->drivers[$requestedName], $requestedName, $feature, null, $defaultOptions);
        }

        return new AiDriverProxy(
            $this->router->createDriver($requestedName, $driverOverrides),
            $requestedName,
            $feature,
            null,
            $defaultOptions
        );
    }

    public function getActiveKey(?string $tier = 'any', ?string $provider = null, ?string $modelGroup = null, ?string $model = null): ?array
    {
        $poolRuntime = $this->router->resolveUsablePoolKey(
            $tier ?: 'any',
            $provider,
            $modelGroup,
            $model
        );

        if (! $poolRuntime) {
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
        $profile = array_merge($this->normalizer->normalizeFeatureProfile($config), $this->normalizer->normalizeFeatureProfile($overrides));
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
        return $this->router->resolveRuntimeProfile($name, $feature, $this->normalizer->normalizeFeatureProfile($featureProfile), $this->forcedTier, fn () => $this->usesPool());
    }

    public function runtimeProfileForFeature(string $feature, array $overrides = []): array
    {
        $config = $this->configManager->get(
            "features.{$feature}",
            config("ai.features.{$feature}", config('ai.default', 'local'))
        );
        $profile = array_merge($this->normalizer->normalizeFeatureProfile($config), $this->normalizer->normalizeFeatureProfile($overrides));
        $driverName = $profile['driver'] ?? (is_string($config) ? trim($config) : null);

        return $this->runtimeProfile($driverName, $feature, $profile);
    }

    public function feature(string $name): LlmDriverInterface
    {
        $config = $this->configManager->get("features.{$name}", config("ai.features.{$name}", config('ai.default', 'local')));
        $profile = $this->normalizer->normalizeFeatureProfile($config);
        $driverName = $profile['driver'] ?? (is_string($config) ? $config : null);

        return $this->driver($driverName, $name, $profile);
    }

    public function chat(array $messages, array $options = []): ?string
    {
        return $this->driver()->chat($messages, $options);
    }
}
