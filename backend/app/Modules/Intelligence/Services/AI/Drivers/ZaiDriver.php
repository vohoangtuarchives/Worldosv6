<?php

namespace App\Modules\Intelligence\Services\AI\Drivers;

use App\Modules\Intelligence\Contracts\LlmDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZaiDriver implements LlmDriverInterface
{
    public function __construct(
        protected string $url,
        protected string $key,
        protected string $model
    ) {}

    public function chat(array $messages, array $options = []): ?string
    {
        $response = Http::timeout($options['timeout'] ?? 60)
            ->withToken($this->key)
            ->post($this->url, [
                'model' => $this->model,
                'messages' => $messages,
                'do_sample' => true,
                'temperature' => (float) ($options['temperature'] ?? 0.7),
                'top_p' => (float) ($options['top_p'] ?? 0.7),
                'max_tokens' => (int) ($options['max_tokens'] ?? 2000),
            ]);

        if (!$response->successful()) {
            $error = $response->body();
            Log::error("ZaiDriver Error: " . $error);
            throw new \Exception("AI Driver Error: " . ($response->json('error.message') ?? $error));
        }

        return $response->json('choices.0.message.content');
    }

    public function generate(string $prompt, array $options = []): ?string
    {
        return $this->chat([
            ['role' => 'user', 'content' => $prompt]
        ], $options);
    }
}
