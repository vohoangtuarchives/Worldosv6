<?php

namespace App\Modules\Intelligence\Services;

use App\Modules\Intelligence\Domain\Policy\IntentResponse;
use App\Modules\Intelligence\Domain\Policy\UniverseContext;
use App\Modules\Intelligence\Entities\ActorEntity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * HTTP client that calls narrative-loom /actor-intent.
 * Hard timeout of 3 seconds - MUST fallback to DecisionEngine on failure.
 */
class LoomIntentClient
{
    private const FEATURE = 'decision';

    private static ?bool $aiLogsHasModelColumn = null;

    private string $baseUrl;

    public function __construct(
        private readonly \App\Modules\Intelligence\Services\AI\AiGateway $aiGateway
    ) {
        $this->baseUrl = rtrim(
            (string) config('services.narrative_loom.url', config('services.loom.url', env('NARRATIVE_LOOM_URL', 'http://narrative_loom:8001'))),
            '/'
        );
    }

    /**
     * Request LLM intent for an actor.
     * Returns null on timeout, error, or low confidence.
     */
    public function requestIntent(ActorEntity $actor, UniverseContext $ctx): ?IntentResponse
    {
        $traits = $this->buildTraitMap($actor);
        $runtime = $this->aiGateway->runtimeProfileForFeature(self::FEATURE);
        $payload = [
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'archetype' => $actor->archetype,
            'traits' => $traits,
            'universe_context' => [
                'entropy' => $ctx->entropy,
                'stability_index' => $ctx->stabilityIndex,
                'myth_intensity' => $ctx->mythIntensity,
                'tick' => $ctx->tick,
            ],
            'recent_biography' => $this->extractRecentBio($actor),
            'available_actions' => [
                'revolt', 'form_contract', 'migrate',
                'trade', 'suppress_revolt', 'propagate_myth',
            ],
            'provider' => $runtime['provider'] ?? 'local',
        ];
        if (!empty($runtime['model'])) {
            $payload['model_name'] = $runtime['model'];
        }
        if (!empty($runtime['api_key'])) {
            $payload['api_key'] = $runtime['api_key'];
        }
        if (!empty($runtime['base_url'])) {
            $payload['base_url'] = $runtime['base_url'];
        }
        $keyEntry = $runtime['key_entry'] ?? null;

        $startTime = microtime(true);
        try {
            $response = Http::timeout(120)->post("{$this->baseUrl}/actor-intent", $payload);
            $latency = (int) ((microtime(true) - $startTime) * 1000);

            if ($response->failed()) {
                Log::debug("[LoomIntentClient] HTTP {$response->status()} for actor {$actor->id}: " . $response->body());
                $this->logToDatabase($payload, $response->body(), $latency, 'error', "HTTP {$response->status()}", $payload['provider']);
                if ($keyEntry) {
                    app(\App\Modules\Intelligence\Actions\ReportKeyUsageAction::class)->handle(
                        $keyEntry,
                        $this->resolveErrorCodeFromHttpFailure($response->status(), $response->body())
                    );
                }
                return null;
            }

            $data = $response->json();
            Log::debug("[LoomIntentClient] Response for actor {$actor->id}: " . json_encode($data));
            $intent = IntentResponse::fromArray($data);

            $this->logToDatabase($payload, $data, $latency, 'success', null, $payload['provider']);

            if ($keyEntry) {
                app(\App\Modules\Intelligence\Actions\ReportKeyUsageAction::class)->handle($keyEntry);
            }

            return $intent->isReliable() ? $intent : null;
        } catch (\Throwable $e) {
            $latency = (int) ((microtime(true) - $startTime) * 1000);
            Log::debug("[LoomIntentClient] Timeout/error for actor {$actor->id}: {$e->getMessage()}");

            $this->logToDatabase($payload, null, $latency, 'error', $e->getMessage(), $payload['provider']);

            if ($keyEntry) {
                app(\App\Modules\Intelligence\Actions\ReportKeyUsageAction::class)->handle(
                    $keyEntry,
                    $this->resolveErrorCodeFromThrowable($e)
                );
            }

            return null;
        }
    }

    private function logToDatabase(
        array $input,
        mixed $output,
        int $latency,
        string $status,
        ?string $error = null,
        string $driver = 'local'
    ): void {
        try {
            $model = is_string($input['model_name'] ?? null) && trim((string) $input['model_name']) !== ''
                ? trim((string) $input['model_name'])
                : (is_string($input['model'] ?? null) && trim((string) $input['model']) !== '' ? trim((string) $input['model']) : null);

            $payload = [
                'feature' => self::FEATURE,
                'driver' => $driver,
                'input' => $input,
                'output' => is_string($output) ? ['text' => $output] : $output,
                'latency_ms' => $latency,
                'status' => $status,
                'error_message' => $error,
            ];

            if ($this->aiLogsHasModelColumn()) {
                $payload['model'] = $model;
            }

            $this->persistAiLog($payload);
        } catch (\Throwable $e) {
            Log::error("[LoomIntentClient] Failed to record AI log: " . $e->getMessage());
        }
    }

    private function buildTraitMap(ActorEntity $actor): array
    {
        $dimensions = ActorEntity::TRAIT_DIMENSIONS;
        $map = [];
        foreach ($dimensions as $i => $name) {
            $map[$name] = round((float) ($actor->traits[$i] ?? 0.5), 3);
        }
        return $map;
    }

    private function extractRecentBio(ActorEntity $actor): string
    {
        if (!$actor->biography) {
            return '';
        }

        $lines = array_filter(explode("\n", $actor->biography));
        $recent = array_slice($lines, -5);
        return implode("\n", $recent);
    }

    private function aiLogsHasModelColumn(): bool
    {
        if (self::$aiLogsHasModelColumn === null) {
            try {
                self::$aiLogsHasModelColumn = Schema::hasColumn('ai_logs', 'model');
            } catch (\Throwable) {
                self::$aiLogsHasModelColumn = false;
            }
        }

        return self::$aiLogsHasModelColumn;
    }

    private function persistAiLog(array $payload): void
    {
        try {
            \App\Models\AiLog::create($payload);
        } catch (\Throwable $e) {
            if (!$this->shouldRetryWithoutModel($e, $payload)) {
                throw $e;
            }

            unset($payload['model']);
            self::$aiLogsHasModelColumn = false;
            \App\Models\AiLog::create($payload);
        }
    }

    private function shouldRetryWithoutModel(\Throwable $e, array $payload): bool
    {
        if (!array_key_exists('model', $payload)) {
            return false;
        }

        $message = strtolower($e->getMessage());

        return str_contains($message, 'column "model"')
            || str_contains($message, "column 'model'")
            || str_contains($message, 'undefined column')
            || str_contains($message, 'sqlstate[42703]');
    }

    private function resolveErrorCodeFromHttpFailure(int $status, string $body): ?int
    {
        $message = strtolower($body);

        if ($status === 401
            || str_contains($message, '401')
            || str_contains($message, 'unauthorized')
            || str_contains($message, 'invalid api key')
            || str_contains($message, 'incorrect api key')
            || str_contains($message, 'token expired')) {
            return 401;
        }

        if ($status === 429
            || str_contains($message, '429')
            || str_contains($message, 'rate limit')) {
            return 429;
        }

        return null;
    }

    private function resolveErrorCodeFromThrowable(\Throwable $e): ?int
    {
        $code = method_exists($e, 'getCode') ? (int) $e->getCode() : null;
        $message = strtolower($e->getMessage());

        if ($code === 401
            || str_contains($message, '401')
            || str_contains($message, 'unauthorized')
            || str_contains($message, 'invalid api key')
            || str_contains($message, 'incorrect api key')
            || str_contains($message, 'token expired')) {
            return 401;
        }

        if ($code === 429
            || str_contains($message, '429')
            || str_contains($message, 'rate limit')) {
            return 429;
        }

        return $code ?: null;
    }
}
