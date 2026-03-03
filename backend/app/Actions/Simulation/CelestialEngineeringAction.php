<?php

namespace App\Actions\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Models\BranchEvent;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

class CelestialEngineeringAction
{
    /**
     * Thực thi các can thiệp vĩ mô (Edicts/Axiom Shifts) từ Ngai vàng Kiến trúc sư (§1.4, §50).
     */
    public function executeMacro(int $worldId, string $type, array $payload): void
    {
        $world = World::findOrFail($worldId);

        switch ($type) {
            case 'axiom_shift':
                $this->performAxiomShift($world, $payload);
                break;
            case 'macro_edict':
                $this->issueMacroEdict($world, $payload);
                break;
            default:
                Log::warning("Unknown Celestial Engineering type: {$type}");
        }
    }

    /**
     * Legacy support for per-universe tech intervention.
     */
    public function execute(Universe $universe, int $tick, array $metrics): void
    {
        $techLevel = (float)($metrics['tech_level'] ?? 0.0);
        if ($techLevel < 0.8) return;

        $vec = $universe->state_vector ?? [];
        $entropy = (float)($vec['entropy'] ?? 0.5);

        if ($entropy > 0.7 && $techLevel > 0.9) {
            $this->reverseEntropy($universe, $tick);
        }
    }

    protected function performAxiomShift(World $world, array $payload): void
    {
        $axiom = $world->evolution_genome ?? [];
        foreach ($payload as $key => $value) {
            $axiom[$key] = $value;
        }
        $world->evolution_genome = $axiom;
        $world->save();

        Log::info("Axiom Shift Triggered for World [{$world->id}]. Propagating to universes...");

        foreach ($world->universes()->where('status', 'active')->get() as $universe) {
            BranchEvent::create([
                'universe_id' => $universe->id,
                'tick' => $universe->current_tick,
                'event_type' => 'axiom_shift',
                'description' => "Cosmological constant shift: " . json_encode($payload),
            ]);
        }
    }

    protected function issueMacroEdict(World $world, array $payload): void
    {
        $edictName = $payload['name'] ?? 'Unknown Edict';
        Log::info("Macro Edict Issued: [{$edictName}] in World [{$world->id}]");

        foreach ($world->universes()->where('status', 'active')->get() as $universe) {
            BranchEvent::create([
                'universe_id' => $universe->id,
                'tick' => $universe->current_tick,
                'event_type' => 'macro_edict',
                'description' => "Grand Edict: {$edictName}",
                'payload' => $payload
            ]);
        }
    }

    protected function reverseEntropy(Universe $universe, int $tick): void
    {
        $vec = $universe->state_vector;
        $oldEntropy = $vec['entropy'];
        $reduction = 0.15;
        $vec['entropy'] = max(0.2, $vec['entropy'] - $reduction);
        $vec['trauma'] = ($vec['trauma'] ?? 0) + 0.25;

        $universe->update(['state_vector' => $vec]);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'celestial_engineering',
            'content' => "KỸ NGHỆ THIÊN THỂ: Đảo ngược entropy thành công từ {$oldEntropy} xuống {$vec['entropy']}.",
        ]);
    }
}
