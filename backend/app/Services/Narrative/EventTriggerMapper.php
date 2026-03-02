<?php

namespace App\Services\Narrative;

use Illuminate\Support\Facades\DB;

/**
 * Tier 2 — Event Triggers: map simulation signals + context to event name / prompt fragment.
 */
class EventTriggerMapper
{
    public function getEventName(string $eventType, array $context): string
    {
        $row = DB::table('event_triggers')
            ->where('event_type', $eventType)
            ->first();

        return $row?->name_template ?? $this->fallbackName($eventType);
    }

    public function getPromptFragment(string $eventType, array $context): string
    {
        $row = DB::table('event_triggers')
            ->where('event_type', $eventType)
            ->first();

        return $row?->prompt_fragment ?? '';
    }

    protected function fallbackName(string $eventType): string
    {
        return match ($eventType) {
            'unrest' => 'Bất ổn xã hội',
            'secession' => 'Ly khai',
            'war' => 'Chiến tranh',
            'crisis' => 'Khủng hoảng',
            default => $eventType,
        };
    }
}
