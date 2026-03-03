<?php

namespace App\Actions\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Models\BranchEvent;
use App\Models\Chronicle;
use App\Services\AI\OmenIntegrationService;
use Illuminate\Support\Facades\Log;

class CelestialEngineeringAction
{
    public function __construct(
        protected OmenIntegrationService $omenService
    ) {}

    /**
     * Thực thi các can thiệp vĩ mô (Edicts/Axiom Shifts) từ Ngai vàng Kiến trúc sư (§1.4, §50).
     */
    public function executeMacro(int $worldId, string $type, array $payload): void
    {
        $world = World::findOrFail($worldId);

        // Phase 97: Chronos Sovereignty (§V21)
        // Strip any attempt to manipulate time/ticks
        $forbiddenKeys = ['time_dilation', 'tick_rate', 'chronos_shift', 'global_tick', 'current_tick'];
        foreach ($forbiddenKeys as $key) {
            unset($payload[$key]);
        }

        if ($type === 'macro_edict') {
            $this->omenService->applyOmenToEdict($payload);
        }

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

            // Phase 70: Ripple Effect (§V12)
            $this->applyRippleEffect($universe, $payload);
        }
    }

    /**
     * Gây ra các biến động tức thì khi Architect hoặc Demiurge can thiệp (§V12, §V14).
     */
    protected function applyRippleEffect(Universe $universe, array $payload): void
    {
        $sciImpact = $payload['sci_impact'] ?? 0.05;
        $entropyImpact = $payload['entropy_impact'] ?? -0.05;
        $demiurgeId = $payload['demiurge_id'] ?? null;

        // Phase 77: Divine Conflict Resolution (§V14)
        if ($demiurgeId) {
            $this->detectConflict($universe, $demiurgeId);
        }

        $universe->structural_coherence = max(0.0, min(1.0, $universe->structural_coherence + $sciImpact));
        $universe->entropy = max(0.0, min(1.0, $universe->entropy + $entropyImpact));
        $universe->save();

        Log::info("MYTHOS: Ripple Effect applied to Universe #{$universe->id}. Source: " . ($demiurgeId ? "Demiurge #{$demiurgeId}" : "Architect"));
    }

    protected function detectConflict(Universe $universe, int $demiurgeId): void
    {
        // Simple conflict detection: check recent branch events for other demiurges
        $recent = $universe->branchEvents()
            ->where('event_type', 'macro_edict')
            ->where('created_at', '>=', now()->subMinutes(5)) // Fast sequential edicts
            ->get();

        foreach ($recent as $event) {
            $prevDemiurgeId = $event->payload['demiurge_id'] ?? null;
            if ($prevDemiurgeId && $prevDemiurgeId !== $demiurgeId) {
                // CLASH DETECTED
                $this->createMythicScar($universe, "Divine Conflict: Rival Wills clashed over this reality.", 0.2);
                Log::warning("CELESTIAL WAR: Demiurge #{$demiurgeId} clashed with Demiurge #{$prevDemiurgeId} in Universe #{$universe->id}");
                break;
            }
        }
    }

    protected function createMythicScar(Universe $universe, string $reason, float $instability): void
    {
        $vec = $universe->state_vector ?? [];
        $scars = $vec['scars'] ?? [];
        $scars[] = [
            'tick' => $universe->current_tick,
            'description' => $reason,
            'intensity' => $instability
        ];
        $vec['scars'] = $scars;
        
        // Increase trauma and instability
        $universe->structural_coherence = max(0.0, $universe->structural_coherence - 0.05);
        $universe->update(['state_vector' => $vec]);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $universe->current_tick,
            'to_tick' => $universe->current_tick,
            'type' => 'mythic_scar',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "VẾT SẸO HUYỀN THOẠI: Chiến tranh thần thánh nổ ra. {$reason}"
            ],
        ]);
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
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "KỸ NGHỆ THIÊN THỂ: Đảo ngược entropy thành công từ {$oldEntropy} xuống {$vec['entropy']}."
            ],
        ]);
    }
}
