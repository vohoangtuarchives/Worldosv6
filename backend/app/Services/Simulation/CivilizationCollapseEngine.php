<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\InstitutionalEntity;
use App\Models\Civilization;
use App\Models\Chronicle;
use App\Services\Narrative\NarrativeScheduler;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CivilizationCollapseEngine – detects and executes structured collapse.
 *
 * A civilization collapses when its entropy overcomes its institutional stability:
 *     entropy > stability × COLLAPSE_THRESHOLD (default 1.4)
 *
 * On collapse:
 *   1. Institutions cluster into fragments (by entity_type affinity)
 *   2. Each cluster spawns a new attractor_instance (representing the emergent sub-civ)
 *   3. Fields are reset (power↓, survival↑, stability↓, knowledge-fragmented)
 *   4. A Chronicle entry records the event for AI narrative
 *
 * This is the mechanism producing Dark Ages, Fragmented Kingdoms, City-States.
 *
 * Relation to theory:
 *   "Collapse Attractor" is the dominant attractor when entropy > 0.75
 *   Collapse generates field shockwave → new attractors emerge in rubble
 *   Combined with Multiverse DAG: collapse creates branch divergence
 */
class CivilizationCollapseEngine
{
    const COLLAPSE_THRESHOLD     = 1.4;  // entropy > stability × this → collapse
    const FIELD_POWER_PENALTY    = 0.4;  // power field drop after collapse
    const FIELD_SURVIVAL_BOOST   = 0.25; // survival field rises (back to basics)
    const FIELD_KNOWLEDGE_LOSS   = 0.3;  // knowledge fragmented: -30%
    const FIELD_STABILITY_DROP   = 0.45; // stability collapses hard

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected VaultService $vaultService,
        protected \App\Services\Simulation\RuleVmService $ruleVm,
        protected ?NarrativeScheduler $narrativeScheduler = null
    ) {
        if ($this->narrativeScheduler === null && \app()->bound(NarrativeScheduler::class)) {
            $this->narrativeScheduler = \app(NarrativeScheduler::class);
        }
    }

    /**
     * Evaluate collapse threshold and execute if triggered.
     * Returns true if collapse occurred.
     */
    public function evaluate(Universe $universe, UniverseSnapshot $snapshot): bool
    {
        // Load Collapse DSL
        $dsl = @file_get_contents(\resource_path('worldos_rules/civilization/collapse.dsl')) ?: '';
        
        // Cần kiểm tra xem collapse có thực sự xảy ra không thông qua outputs
        // Vì evaluateAndApply chỉ chạy side-effects, ta cần lấy output để biết có trigger sụp đổ không.
        
        $engine = \app(\App\Contracts\SimulationEngineClientInterface::class);
        $state = $this->ruleVm->buildStateForVm($universe, $snapshot);
        $result = $engine->evaluateRules($state, $dsl);

        if (!($result['ok'] ?? false)) return false;

        $outputs = $result['outputs'] ?? [];
        $triggered = false;
        foreach ($outputs as $out) {
            if ($out['type'] === 'event' && ($out['event_name'] === 'CIVILIZATION_COLLAPSE_TRIGGERED')) {
                $triggered = true;
                break;
            }
        }

        if ($triggered) {
            Log::warning("CivilizationCollapseEngine: Universe #{$universe->id} — collapse triggered via DSL.");
            // Apply side effects từ DSL (thay đổi state fields)
            $this->ruleVm->evaluateAndApply($universe, $snapshot, $dsl);
            
            $metadata = [];
            foreach ($outputs as $out) {
                if (($out['event_name'] ?? '') === 'CIVILIZATION_COLLAPSE_TRIGGERED') {
                    $metadata = $out['metadata'] ?? [];
                    break;
                }
            }

            // Execute additional PHP-only side effects (fragmenting institutions, chronicle)
            $this->executeCollapse($universe, $snapshot, "DSL Triggered Collapse", $metadata);
            return true;
        }

        return false;
    }

    /**
     * Execute the collapse: fragment institutions, spawn new attractors, update fields.
     */
    protected function executeCollapse(Universe $universe, UniverseSnapshot $snapshot, string $reason, array $metadata = []): void
    {
        $tick = $snapshot->tick;

        // 1. Get active institutions and cluster them
        $institutions = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $clusters = $this->clusterInstitutions($institutions->toArray());

        // 2. For each cluster, spawn a new collapse-fragment attractor instance
        $baseStrength = (float) ($metadata['base_attractor_strength'] ?? 0.5);
        $bonus = (float) ($metadata['attractor_strength_bonus'] ?? 0.05);

        foreach ($clusters as $clusterType => $members) {
            $childAttractorType = $this->mapClusterToAttractor($clusterType);
            DB::table('attractor_instances')->insert([
                'universe_id'    => $universe->id,
                'attractor_type' => $childAttractorType,
                'strength'       => $baseStrength + (count($members) * $bonus),
                'state_json'     => json_encode([
                    'spawned_by_collapse' => true,
                    'parent_cluster'      => $clusterType,
                    'members'             => count($members),
                ]),
                'spawned_by'     => null,
                'created_tick'   => $tick,
                'expires_tick'   => null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        // 3. Archive & Mark all institutions as collapsed
        foreach ($institutions as $inst) {
            $this->vaultService->archiveInstitution($inst, $tick);
        }

        InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->update(['collapsed_at_tick' => $tick, 'legitimacy' => 0.1]);

        // 3b. Ensure Civilization records and schedule narrative for each collapsed institution
        if ($this->narrativeScheduler) {
            InstitutionalEntity::where('universe_id', $universe->id)
                ->where('collapsed_at_tick', $tick)
                ->get()
                ->each(function (InstitutionalEntity $inst) use ($universe, $tick) {
                    $civ = $this->ensureCivilizationForInstitution($inst, $tick);
                    if ($civ) {
                        $this->narrativeScheduler->scheduleCivilization($universe->id, $civ->id);
                    }
                });
        }

        // 4. Chronicle the collapse
        $clusterSummary = implode(', ', array_keys($clusters));
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick'   => $tick,
            'to_tick'     => $tick,
            'type'        => 'civilization_collapse',
            'raw_payload' => [
                'action'          => 'collapse',
                'fragment_count'  => count($clusters),
                'fragment_types'  => $clusterSummary,
                'description'     => "Văn minh sụp đổ tại tick {$tick} do {$reason}. Các mảnh nổi lên: {$clusterSummary}.",
            ],
        ]);

        Log::warning("CivilizationCollapseEngine: collapse complete. {$institutions->count()} institutions collapsed, " . count($clusters) . " fragments spawned.");
    }

    /**
     * Group institutions into clusters by their 'entity_type'.
     * Returns [ type => [institution records] ]
     */
    protected function clusterInstitutions(array $institutions): array
    {
        $clusters = [];
        foreach ($institutions as $inst) {
            $type = $inst['entity_type'] ?? 'unknown';
            $clusters[$type][] = $inst;
        }
        return $clusters;
    }

    /**
     * Map institution cluster types to appropriate attractor types.
     */
    protected function mapClusterToAttractor(string $clusterType): string
    {
        return match ($clusterType) {
            'military', 'fortress' => 'competition',
            'religion', 'temple'   => 'meaning',
            'corporation', 'guild' => 'trade',
            'academy', 'library'   => 'knowledge',
            'regime', 'monarchy'   => 'hierarchy',
            default                => 'survival',
        };
    }

    /**
     * Get collapse history for a universe (for PossibilityNavigator scoring).
     */
    public function getCollapseCount(int $universeId): int
    {
        return Chronicle::where('universe_id', $universeId)
            ->where('type', 'civilization_collapse')
            ->count();
    }

    protected function ensureCivilizationForInstitution(InstitutionalEntity $inst, int $collapseTick): ?Civilization
    {
        $civ = $inst->civilization_id ? Civilization::find($inst->civilization_id) : null;
        if (!$civ) {
            $civ = Civilization::create([
                'universe_id' => $inst->universe_id,
                'name' => $inst->name ?? 'Unknown Civilization',
                'origin_tick' => (int) ($inst->spawned_at_tick ?? 0),
                'collapse_tick' => $collapseTick,
                'capital_zone_id' => $inst->zone_id,
            ]);
            $inst->civilization_id = $civ->id;
            $inst->save();
        } else {
            $civ->update(['collapse_tick' => $collapseTick]);
        }
        return $civ;
    }
}
