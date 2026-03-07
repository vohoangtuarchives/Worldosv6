<?php

namespace App\Modules\Intelligence\Services\Lab;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Layer 10: AI Scientist Adapter.
 * Integrates with the local LM Studio model to analyze data and propose theories.
 */
class AiScientistAdapter
{
    private string $llmUrl;
    private string $modelName;

    public function __construct()
    {
        // Using same connection config logic as narrative engine
        $this->llmUrl = env('LOCAL_LLM_URL', 'http://host.docker.internal:1234/v1');
        $this->modelName = env('LOCAL_LLM_MODEL', 'TheBloke/MythoMax-L2-13B-GGUF');
    }

    /**
     * Ask the LLM to formulate a theory based on discovered laws and raw data.
     * 
     * @param array $laws Rules from UniversalLawDiscovery
     * @param array $context Additional simulation context
     */
    public function formulateTheory(array $laws, array $context): ?string
    {
        $prompt = "You are the AI Scientist overseeing a multiverse simulation. Based on the following data, formulate a concise, academic theory about civilization dynamics.\n";
        $prompt .= "Discovered Laws:\n" . json_encode($laws, JSON_PRETTY_PRINT) . "\n";
        $prompt .= "Context:\n" . json_encode($context, JSON_PRETTY_PRINT) . "\n\n";
        $prompt .= "Theory: ";

        try {
            $response = Http::timeout(120)->post("{$this->llmUrl}/chat/completions", [
                'model' => $this->modelName,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a brilliant sociologist, physicist, and AI scientist observing simulated civilizations.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
                'max_tokens' => 300,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }
            
            Log::error("AI Scientist API failed: " . $response->body());
        } catch (\Exception $e) {
            Log::error("AI Scientist Connection failed: " . $e->getMessage());
        }

        return null; // Fallback
    }
}
