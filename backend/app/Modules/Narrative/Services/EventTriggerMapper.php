<?php

namespace App\Modules\Narrative\Services;

class EventTriggerMapper
{
    public function getMetricValue(array $state, string $key): mixed
    {
         return $state[$key] ?? null;
    }
}
