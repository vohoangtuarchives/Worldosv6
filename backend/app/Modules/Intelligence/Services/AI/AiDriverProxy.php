<?php

namespace App\Modules\Intelligence\Services\AI;

use App\Models\AiKeyPool;
use App\Models\AiLog;
use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AiDriverProxy implements LlmDriverInterface
{
    protected static ?bool $aiLogsHasModelColumn = null;

    public function __construct(
        protected LlmDriverInterface $driver,
        protected string $driverName,
        protected string $feature,
        protected ?AiKeyPool $keyPoolEntry = null,
        protected array $defaultOptions = []
    ) {}

    public function chat(array $messages, array $options = []): ?string
    {
        $startTime = microtime(true);

        try {
            $options = $this->mergeDefaultOptions($options);
            $options['timeout'] = max((int) ($options['timeout'] ?? 0), 300);

            $response = $this->driver->chat($messages, $options);
            $response = $this->cleanResponse($response);
            $latency = (int) ((microtime(true) - $startTime) * 1000);

            if ($response === null || (is_string($response) && trim($response) === '')) {
                $this->logToDatabase($messages, null, $latency, 'error', 'AI driver returned an empty or null response.');
            } else {
                $this->logToDatabase($messages, $response, $latency, 'success');
                $this->reportUsage();
            }

            return $response;
        } catch (\Throwable $e) {
            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->logToDatabase($messages, null, $latency, 'error', $e->getMessage());
            $this->reportUsage($e);
            throw $e;
        }
    }

    public function generate(string $prompt, array $options = []): ?string
    {
        $startTime = microtime(true);

        try {
            $options = $this->mergeDefaultOptions($options);
            $options['timeout'] = max((int) ($options['timeout'] ?? 0), 300);

            $response = $this->driver->generate($prompt, $options);
            $response = $this->cleanResponse($response);
            $latency = (int) ((microtime(true) - $startTime) * 1000);

            if ($response === null || (is_string($response) && trim($response) === '')) {
                $this->logToDatabase(['prompt' => $prompt], null, $latency, 'error', 'AI driver returned an empty or null response.');
            } else {
                $this->logToDatabase(['prompt' => $prompt], $response, $latency, 'success');
                $this->reportUsage();
            }

            return $response;
        } catch (\Throwable $e) {
            $latency = (int) ((microtime(true) - $startTime) * 1000);
            $this->logToDatabase(['prompt' => $prompt], null, $latency, 'error', $e->getMessage());
            $this->reportUsage($e);
            throw $e;
        }
    }

    public function metadata(): array
    {
        return array_merge(
            [
                'driver' => $this->driverName,
                'feature' => $this->feature,
            ],
            $this->driver->metadata()
        );
    }

    protected function logToDatabase(array $input, mixed $output, int $latency, string $status, ?string $error = null): void
    {
        try {
            $metadata = $this->metadata();
            $payload = [
                'feature' => $this->feature,
                'driver' => $this->driverName,
                'input' => $input,
                'output' => is_string($output) ? ['text' => $output] : $output,
                'latency_ms' => $latency,
                'status' => $status,
                'error_message' => $error,
            ];

            if ($this->aiLogsHasModelColumn()) {
                $payload['model'] = $this->resolveModel($metadata, $input);
            }

            $this->persistAiLog($payload);
        } catch (\Throwable $e) {
            Log::error('Failed to record AI log: ' . $e->getMessage());
        }
    }

    protected function cleanResponse(?string $response): ?string
    {
        if ($response === null) {
            return null;
        }

        if (preg_match('/^```(?:json)?\s*([\s\S]*?)\s*```$/i', trim($response), $matches)) {
            return trim($matches[1]);
        }

        return $response;
    }

    protected function resolveModel(array $metadata, array $input): ?string
    {
        $candidates = [
            $metadata['model'] ?? null,
            $input['model'] ?? null,
            $input['model_name'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                return trim($candidate);
            }
        }

        return null;
    }

    protected function mergeDefaultOptions(array $options): array
    {
        foreach ($this->defaultOptions as $key => $value) {
            if (!array_key_exists($key, $options) && $value !== null && $value !== '') {
                $options[$key] = $value;
            }
        }

        return $options;
    }

    protected function reportUsage(?\Throwable $e = null): void
    {
        if (!$this->keyPoolEntry) {
            return;
        }

        app(\App\Modules\Intelligence\Actions\ReportKeyUsageAction::class)->handle(
            $this->keyPoolEntry,
            $this->resolveErrorCode($e)
        );
    }

    protected function aiLogsHasModelColumn(): bool
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

    protected function persistAiLog(array $payload): void
    {
        try {
            AiLog::create($payload);
        } catch (\Throwable $e) {
            if (!$this->shouldRetryWithoutModel($e, $payload)) {
                throw $e;
            }

            unset($payload['model']);
            self::$aiLogsHasModelColumn = false;
            AiLog::create($payload);
        }
    }

    protected function shouldRetryWithoutModel(\Throwable $e, array $payload): bool
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

    protected function resolveErrorCode(?\Throwable $e = null): ?int
    {
        if (!$e) {
            return null;
        }

        $errorCode = null;

        if ($e instanceof \Illuminate\Http\Client\RequestException) {
            $errorCode = $e->response?->status() ?? $e->getCode();
        } elseif (method_exists($e, 'getCode')) {
            $errorCode = (int) $e->getCode();
        }

        $message = strtolower($e->getMessage());

        if ($errorCode === 401
            || str_contains($message, '401')
            || str_contains($message, 'unauthorized')
            || str_contains($message, 'invalid api key')
            || str_contains($message, 'incorrect api key')
            || str_contains($message, 'token expired')) {
            return 401;
        }

        if ($errorCode === 429
            || str_contains($message, '429')
            || str_contains($message, 'rate limit')) {
            return 429;
        }

        return $errorCode ?: null;
    }
}
