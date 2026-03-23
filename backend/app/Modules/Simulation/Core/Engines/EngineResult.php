<?php
namespace App\Modules\Simulation\Core\Engines;

class EngineResult {
    public array $events = [];
    public array $metrics = [];
    public array $stateChanges = [];
    public array $causalLinks = [];

    public static function empty(): self
    {
        return new self();
    }
}
