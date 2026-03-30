<?php

namespace App\Modules\Intelligence\Services\AI\Drivers;

use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LocalDriver implements LlmDriverInterface
{
    public function __construct(
        protected string $url,
        protected string $model
    ) {}

    public function chat(array $messages, array $options = []): ?string
    {
        try {
            $timeout = $options['timeout'] ?? 60;
            $response = Http::connectTimeout(10)
                ->timeout($timeout)
                ->post($this->url, [
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => $options['temperature'] ?? 0.7,
                    'max_tokens' => $options['max_tokens'] ?? 512,
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }

            Log::warning("LocalDriver HTTP {$response->status()}: " . substr($response->body(), 0, 200));
        } catch (\Throwable $e) {
            Log::warning("LocalDriver error [{$this->model}]: " . $e->getMessage());
        }

        return null;
    }

    public function generate(string $prompt, array $options = []): ?string
    {
        return $this->chat([
            ['role' => 'user', 'content' => $prompt]
        ], $options);
    }
}
