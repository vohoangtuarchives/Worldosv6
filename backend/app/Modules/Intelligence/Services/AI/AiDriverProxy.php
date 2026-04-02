<?php

namespace App\Modules\Intelligence\Services\AI;

use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use App\Models\AiLog;
use Illuminate\Support\Facades\Log;

class AiDriverProxy implements LlmDriverInterface
{
    public function __construct(
        protected LlmDriverInterface $driver,
        protected string $driverName,
        protected string $feature,
        protected ?\App\Models\AiKeyPool $keyPoolEntry = null
    ) {}

    public function chat(array $messages, array $options = []): ?string
    {
        $startTime = microtime(true);
        try {
            $options['timeout'] = max($options['timeout'] ?? 0, 300);
            $response = $this->driver->chat($messages, $options);
            $response = $this->cleanResponse($response);
            $latency = (int)((microtime(true) - $startTime) * 1000);

            if ($response === null || (is_string($response) && trim($response) === '')) {
                $this->logToDatabase($messages, null, $latency, 'error', 'AI driver returned an empty or null response.');
            } else {
                $this->logToDatabase($messages, $response, $latency, 'success');
                $this->reportUsage();
            }

            return $response;
        } catch (\Throwable $e) {
            $latency = (int)((microtime(true) - $startTime) * 1000);
            $this->logToDatabase($messages, null, $latency, 'error', $e->getMessage());
            
            $this->reportUsage($e);
            
            throw $e;
        }
    }

    public function generate(string $prompt, array $options = []): ?string
    {
        $startTime = microtime(true);
        try {
            $options['timeout'] = max($options['timeout'] ?? 0, 300);
            $response = $this->driver->generate($prompt, $options);
            $response = $this->cleanResponse($response);
            $latency = (int)((microtime(true) - $startTime) * 1000);

            if ($response === null || (is_string($response) && trim($response) === '')) {
                $this->logToDatabase(['prompt' => $prompt], null, $latency, 'error', 'AI driver returned an empty or null response.');
            } else {
                $this->logToDatabase(['prompt' => $prompt], $response, $latency, 'success');
                $this->reportUsage();
            }

            return $response;
        } catch (\Throwable $e) {
            $latency = (int)((microtime(true) - $startTime) * 1000);
            $this->logToDatabase(['prompt' => $prompt], null, $latency, 'error', $e->getMessage());
            
            $this->reportUsage($e);
            
            throw $e;
        }
    }

    protected function logToDatabase(array $input, $output, int $latency, string $status, ?string $error = null): void
    {
        try {
            AiLog::create([
                'feature' => $this->feature,
                'driver' => $this->driverName,
                'input' => $input,
                'output' => is_string($output) ? ['text' => $output] : $output,
                'latency_ms' => $latency,
                'status' => $status,
                'error_message' => $error,
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to record AI log: " . $e->getMessage());
        }
    }

    /**
     * Clean Response: Strip markdown JSON wrappers if present.
     */
    protected function cleanResponse(?string $response): ?string
    {
        if ($response === null) return null;

        // Strip ```json ... ``` or ``` ... ```
        if (preg_match('/^```(?:json)?\s*([\s\S]*?)\s*```$/i', trim($response), $matches)) {
            return trim($matches[1]);
        }

        return $response;
    }

    protected function reportUsage(?\Throwable $e = null): void
    {
        if (!$this->keyPoolEntry) {
            return;
        }

        $errorCode = null;
        if ($e instanceof \Illuminate\Http\Client\RequestException) {
            $errorCode = $e->getCode();
        } elseif ($e && method_exists($e, 'getCode')) {
            $errorCode = $e->getCode();
        }

        // Tự động detect lỗi Rate Limit từ message nếu code không chuẩn
        if ($e && $errorCode !== 429 && (str_contains(strtolower($e->getMessage()), 'rate limit') || str_contains($e->getMessage(), '429'))) {
            $errorCode = 429;
        }

        app(\App\Modules\Intelligence\Actions\ReportKeyUsageAction::class)->handle(
            $this->keyPoolEntry,
            $errorCode
        );
    }
}
