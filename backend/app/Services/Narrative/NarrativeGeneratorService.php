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
        Generate a single short sentence (under 50 words) describing a significant life event for a character.
        Character: {$actorName} ({$archetype}).
        Traits: " . json_encode($traits) . ".
        World Context: " . json_encode($worldContext) . ".
        Output ONLY the event description and in Vietnamese.";
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
                ['role' => 'system', 'content' => 'You are a creative writer.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7,
        ]);

        if ($response->successful()) {
            $content = trim($response->json('choices.0.message.content') ?? '');
            
            // Reasoning models (e.g. gpt-oss-20b) sometimes output the answer inside
            // the `reasoning` field and leave `content` empty. Extract it as fallback.
            if ($content === '') {
                $reasoning = $response->json('choices.0.message.reasoning') ?? '';
                // Grab the last quoted phrase from the reasoning as the final answer
                if (preg_match_all('/["\u201c\u201d\u2018\u2019]([^""\u201c\u201d\u2018\u2019]{10,})["\u201c\u201d\u2018\u2019]/', $reasoning, $matches)) {
                    $content = end($matches[1]);
                } elseif (preg_match('/(?:craft|output|sentence)[:\s]+(.{15,}?)(?:\.|$)/iu', $reasoning, $m)) {
                    $content = trim($m[1]);
                }
                if ($content !== '') {
                    Log::info("NarrativeGenerator: Extracted content from reasoning field.");
                }
            }
            
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
