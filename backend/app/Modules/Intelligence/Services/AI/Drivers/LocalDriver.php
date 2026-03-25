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
            $response = Http::timeout($options['timeout'] ?? 60)
                ->post($this->url, [
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => $options['temperature'] ?? 0.7,
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }
        } catch (\Throwable $e) {
            Log::debug("LocalDriver debug (silent): " . $e->getMessage());
        }

        return null;
    }
}
