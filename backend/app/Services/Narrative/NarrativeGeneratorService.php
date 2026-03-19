<?php

namespace App\Services\Narrative;

/**
 * [SHIM] 🚧 Legacy backward compatibility for components 
 * still requesting App\Services\Narrative\NarrativeGeneratorService.
 */
class NarrativeGeneratorService extends NarrativeAiService
{
    /**
     * Legacy method for generating a short life event snippet for actors.
     */
    public function generateLifeEvent(string $name, string $archetype, array $traits, array $options = []): string
    {
        $genre = $options['genre'] ?? 'wuxia';
        
        // Simple procedural fallback for speed and stability
        $verbs = ['đã đột phá', 'vừa ngộ ra', 'đang rèn luyện', 'vừa hoàn thành'];
        $nouns = ['công pháp', 'bí tịch', 'thử thách', 'nhiệm vụ'];
        
        $randomVerb = $verbs[array_rand($verbs)];
        $randomNoun = $nouns[array_rand($nouns)];
        
        return "{$name} ({$archetype}) {$randomVerb} một {$randomNoun} mới trong thế giới {$genre}.";
    }

    /**
     * Map old evaluateAction to new logic if needed.
     */
    public function evaluateAction(string $name, string $action, array $context): array
    {
        return [
            'success' => true,
            'narrative' => "{$name} thực hiện {$action} thành công.",
            'impact' => ['influence' => 0.01]
        ];
    }
}
