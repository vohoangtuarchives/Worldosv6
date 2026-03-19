<?php

namespace App\Modules\Simulation\Services;

use App\Models\Actor;
use Illuminate\Support\Facades\File;

/**
 * VocationEngine manages actor vocation progression and stat calculation.
 * It maps actor achievements and attributes to the available vocation paths
 * defined in the RuleSet.
 */
class VocationEngine
{
    private array $vocations;

    public function __construct()
    {
        $path = app_path('Modules/Simulation/Data/vocations.json');
        $this->vocations = File::exists($path) ? json_decode(File::get($path), true)['vocations'] : [];
    }

    /**
     * Calculate updated stats for an actor based on their current vocation.
     */
    public function calculateStats(Actor $actor): array
    {
        $vocationId = $actor->vocation_id ?? 'commoner';
        $vocation = $this->findVocation($vocationId);

        if (!$vocation) {
            return $actor->stats ?? [];
        }

        $baseStats = $actor->stats ?? [];
        $scaling = $vocation['base_stats'] ?? [];

        foreach ($scaling as $stat => $coefficient) {
            if (isset($baseStats[$stat])) {
                $baseStats[$stat] *= $coefficient;
            }
        }

        return $baseStats;
    }

    /**
     * Check if an actor is eligible for a higher-tier vocation.
     */
    public function getEligibleEvolutions(Actor $actor): array
    {
        $currentVocation = $this->findVocation($actor->vocation_id ?? 'commoner');
        if (!$currentVocation) {
            return [];
        }

        $eligible = [];
        $possibleEvolutions = $currentVocation['evolves_to'] ?? [];

        foreach ($possibleEvolutions as $vocationId) {
            $vocation = $this->findVocation($vocationId);
            if ($vocation && $this->meetsRequirements($actor, $vocation)) {
                $eligible[] = $vocation;
            }
        }

        return $eligible;
    }

    private function findVocation(string $id): ?array
    {
        foreach ($this->vocations as $vocation) {
            if ($vocation['id'] === $id) {
                return $vocation;
            }
        }
        return null;
    }

    private function meetsRequirements(Actor $actor, array $vocation): bool
    {
        $requirements = $vocation['requirements'] ?? [];
        $actorStats = $actor->stats ?? [];
        $actorMetics = $actor->metrics ?? [];

        foreach ($requirements as $key => $value) {
            $actualValue = $actorStats[$key] ?? $actorMetics[$key] ?? 0;
            if ($actualValue < $value) {
                return false;
            }
        }

        return true;
    }
}
