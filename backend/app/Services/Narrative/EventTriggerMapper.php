<?php

namespace App\Services\Narrative;

/**
 * EventTriggerMapper: Maps world metrics to simplified values for rule evaluation.
 */
class EventTriggerMapper
{
    /**
     * Get a metric value from state vector or snapshot by key.
     */
    public function getMetricValue($source, string $key): float
    {
        if (is_array($source)) {
            return (float) ($source[$key] ?? $source['metrics'][$key] ?? 0.0);
        }
        
        if (is_object($source)) {
            return (float) ($source->$key ?? ($source->metrics[$key] ?? 0.0));
        }

        return 0.0;
    }
}
