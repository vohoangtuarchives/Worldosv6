<?php

namespace App\Services\Narrative;

use App\Models\AgentConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NarrativeGeneratorService
{
    protected $config;

    public function __construct()
    {
        $this->config = AgentConfig::first();
    }

    public function generateLifeEvent(string $actorName, string $archetype, array $traits, array $worldContext): string
    {
        if (!$this->config) {
            return $this->fallbackGeneration($actorName, $archetype);
        }

        $prompt = $this->buildPrompt($actorName, $archetype, $traits, $worldContext);
        
        try {
            if ($this->config->model_type === 'local') {
                return $this->callLocalAI($prompt);
            } else {
                // Future implementation for OpenAI/Anthropic
                return $this->fallbackGeneration($actorName, $archetype);
            }
        } catch (\Exception $e) {
            Log::error("Narrative Generation Failed: " . $e->getMessage());
            return $this->fallbackGeneration($actorName, $archetype);
        }
    }

    protected function buildPrompt(string $actorName, string $archetype, array $traits, array $worldContext): string
    {
        $personality = $this->config->personality ?? 'Objective';
        $themes = implode(', ', $this->config->themes ?? ['General']);
        $creativity = $this->config->creativity ?? 50;
        
        return "You are a {$personality} narrator focusing on themes: {$themes}. Creativity Level: {$creativity}%.
        Generate a single short sentence (under 20 words) describing a significant life event for a character.
        Character: {$actorName} ({$archetype}).
        Traits: " . json_encode($traits) . ".
        World Context: " . json_encode($worldContext) . ".
        Output ONLY the event description.";
    }

    protected function callLocalAI(string $prompt): string
    {
        $endpoint = $this->config->local_endpoint ?? 'http://host.docker.internal:11434/v1/chat/completions';
        $model = $this->config->model_name ?? 'mistral';

        // Adjust localhost to host.docker.internal if running inside docker
        if (str_contains($endpoint, 'localhost')) {
            $endpoint = str_replace('localhost', 'host.docker.internal', $endpoint);
        }

        $response = Http::timeout(5)->post($endpoint, [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'You are a creative writer for a simulation game.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
            'max_tokens' => 50
        ]);

        if ($response->successful()) {
            $content = $response->json('choices.0.message.content');
            return trim(str_replace(['"', "'"], '', $content));
        }

        throw new \Exception("Local AI Error: " . $response->status());
    }

    protected function fallbackGeneration(string $actorName, string $archetype): string
    {
        $events = [
            "discovered a hidden talent.",
            "made a rival in the local guild.",
            "found an ancient artifact.",
            "lost a significant wager.",
            "witnessed a rare celestial event.",
            "wrote a treatise on philosophy.",
            "traveled to a distant land."
        ];
        return $events[array_rand($events)];
    }
}
