<?php

namespace App\Services\Narrative;

/**
 * Single interpretation of an event from one perspective (Narrative v2 Layer 4).
 */
final class EventInterpretation
{
    public const PERSPECTIVE_PHYSICS = 'physics';
    public const PERSPECTIVE_CIVILIZATION = 'civilization';
    public const PERSPECTIVE_RELIGION = 'religion';
    public const PERSPECTIVE_MYTH = 'myth';

    public function __construct(
        public readonly string $perspective,
        public readonly string $label,
        public readonly ?int $civId = null,
        public readonly ?string $source = null,
    ) {
    }

    public function toArray(): array
    {
        return [
            'perspective' => $this->perspective,
            'label' => $this->label,
            'civ_id' => $this->civId,
            'source' => $this->source,
        ];
    }
}
