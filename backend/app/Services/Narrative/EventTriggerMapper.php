<?php

namespace App\Services\Narrative;

use App\Simulation\Support\RuleEngine;
use Illuminate\Support\Facades\DB;

/**
 * Tier 2 — Event Triggers: map simulation signals + context to event name / prompt fragment.
 * Detects which events are "active" from state_vector metrics via threshold_rules (key, op, value).
 */
class EventTriggerMapper
{
    public function __construct(
        protected RuleEngine $ruleEngine
    ) {}

    /**
     * Detect event types that match current state_vector metrics (threshold_rules).
     * Supports state_vector root, metrics, and pressures keys.
     */
    public function detectTriggeredEvents(array $stateVector): array
    {
        $rows = DB::table('event_triggers')
            ->whereNotNull('threshold_rules')
            ->get();

        $triggered = [];
        $getValue = fn (string $key) => $this->getMetricValue($stateVector, $key);
        foreach ($rows as $row) {
            $rules = $row->threshold_rules;
            if (is_string($rules)) {
                $rules = json_decode($rules, true);
            }
            if (!is_array($rules) || empty($rules)) {
                continue;
            }
            if ($this->ruleEngine->evaluate($rules, $stateVector, $getValue)) {
                $triggered[] = $row->event_type;
            }
        }

        return array_values(array_unique($triggered));
    }

    /**
     * Resolve metric/pressure value from state_vector (root, metrics, or pressures).
     */
    public function getMetricValue(array $stateVector, string $key): mixed
    {
        if (array_key_exists($key, $stateVector) && $stateVector[$key] !== null) {
            return $stateVector[$key];
        }
        $metrics = $stateVector['metrics'] ?? [];
        if (is_array($metrics) && array_key_exists($key, $metrics)) {
            return $metrics[$key];
        }
        $pressures = $stateVector['pressures'] ?? [];
        if (is_array($pressures) && array_key_exists($key, $pressures)) {
            return $pressures[$key];
        }
        if ($key === 'entropy' && array_key_exists('entropy', $stateVector)) {
            return $stateVector['entropy'];
        }
        return null;
    }

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
            'golden_age' => 'Thời kỳ hoàng kim',
            'fork' => 'Phân nhánh vũ trụ',
            'collapse' => 'Sụp đổ',
            'formation' => 'Hình thành định chế',
            'myth_scar' => 'Di chứng thần thoại',
            'micro_mode' => 'Cửa sổ vi mô',
            'meta_cycle' => 'Chu kỳ siêu vĩ mô',
            default => $eventType,
        };
    }
}
