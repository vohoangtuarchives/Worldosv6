<?php

namespace App\Services\Narrative;

/**
 * Perspective Engine (Narrative v2 Layer 4).
 *
 * Produces Physics / Civilization / Religion / Myth interpretations for an event payload.
 * Consumed by Chronicle and PerceivedArchive/MythicResonance.
 */
class PerspectiveEngine
{
    /**
     * @param  array{category?: string, metrics?: array, facts?: array, entropy?: float, stability_index?: float}  $eventPayload
     * @param  array{ideology?: string, religion?: string, civ_id?: int}  $context
     * @return EventInterpretation[]
     */
    public function interpret(array $eventPayload, array $context = []): array
    {
        $category = $eventPayload['category'] ?? 'unknown';
        $metrics = $eventPayload['metrics'] ?? [];
        $facts = $eventPayload['events'] ?? $eventPayload['facts'] ?? [];
        $entropy = (float) ($eventPayload['entropy'] ?? 0.5);
        $stability = (float) ($eventPayload['stability_index'] ?? 0.5);

        $interpretations = [];

        $interpretations[] = new EventInterpretation(
            EventInterpretation::PERSPECTIVE_PHYSICS,
            $this->physicsLabel($category, $metrics, $entropy, $stability),
            null,
            'physics'
        );

        $interpretations[] = new EventInterpretation(
            EventInterpretation::PERSPECTIVE_CIVILIZATION,
            $this->civilizationLabel($category, $facts, $metrics),
            $context['civ_id'] ?? null,
            'civilization'
        );

        $interpretations[] = new EventInterpretation(
            EventInterpretation::PERSPECTIVE_RELIGION,
            $this->religionLabel($category, $context['religion'] ?? null),
            $context['civ_id'] ?? null,
            'religion'
        );

        $interpretations[] = new EventInterpretation(
            EventInterpretation::PERSPECTIVE_MYTH,
            $this->mythLabel($category, $entropy, $stability),
            null,
            'myth'
        );

        return $interpretations;
    }

    private function physicsLabel(string $category, array $metrics, float $entropy, float $stability): string
    {
        $parts = ["Tick event: {$category}"];
        if ($entropy > 0) {
            $parts[] = sprintf('entropy=%.2f', $entropy);
        }
        if ($stability > 0) {
            $parts[] = sprintf('stability=%.2f', $stability);
        }
        if (! empty($metrics)) {
            $parts[] = 'metrics=' . json_encode($metrics);
        }

        return implode(', ', $parts);
    }

    private function civilizationLabel(string $category, array $facts, array $metrics): string
    {
        $events = empty($facts) ? [$category] : $facts;

        return 'Civilization view: ' . implode('; ', array_slice($events, 0, 5));
    }

    private function religionLabel(string $category, ?string $religion): string
    {
        $deity = $religion ? " ({$religion})" : '';

        return match (true) {
            str_contains($category, 'collapse') => "The gods{$deity} have withdrawn their favour.",
            str_contains($category, 'pressure') => "The divine order{$deity} adjusts the balance.",
            default => "The will of the heavens{$deity} manifests in this turn.",
        };
    }

    private function mythLabel(string $category, float $entropy, float $stability): string
    {
        if ($entropy > 0.8) {
            return 'The sky dragon stirs; the old laws crumble.';
        }
        if ($stability < 0.3) {
            return 'The earth remembers the fall of towers.';
        }

        return 'Legends speak of this age in fragments.';
    }
}
