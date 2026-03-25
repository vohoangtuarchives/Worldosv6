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
        protected string $feature
    ) {}

    public function chat(array $messages, array $options = []): ?string
    {
        $startTime = microtime(true);
        try {
            $response = $this->driver->chat($messages, $options);
            $response = $this->cleanResponse($response);
            $latency = (int)((microtime(true) - $startTime) * 1000);

            if ($response === null || (is_string($response) && trim($response) === '')) {
                $this->logToDatabase($messages, null, $latency, 'error', 'AI driver returned an empty or null response.');
            } else {
                $this->logToDatabase($messages, $response, $latency, 'success');
            }

            return $response;
        } catch (\Throwable $e) {
            $latency = (int)((microtime(true) - $startTime) * 1000);
            $this->logToDatabase($messages, null, $latency, 'error', $e->getMessage());
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
}
