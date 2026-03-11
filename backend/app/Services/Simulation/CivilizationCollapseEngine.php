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
        protected ?NarrativeScheduler $narrativeScheduler = null
    ) {
        if ($this->narrativeScheduler === null && app()->bound(NarrativeScheduler::class)) {
            $this->narrativeScheduler = app(NarrativeScheduler::class);
        }
    }

    /**
     * Evaluate collapse threshold and execute if triggered.
     * Returns true if collapse occurred.
     */
    public function evaluate(Universe $universe, UniverseSnapshot $snapshot): bool
    {
        $entropy  = (float) ($snapshot->entropy ?? 0.5);
        $vec      = (array) ($snapshot->state_vector ?? []);
        $stability = (float) ($vec['stability_index'] ?? $vec['sci'] ?? 0.5);

        if ($entropy <= $stability * self::COLLAPSE_THRESHOLD) {
            return false;
        }

        $reason = ($stability < 0.25) ? "Critical Stability (SCI) Decay" : "Excessive Institutional Entropy";
        Log::warning("CivilizationCollapseEngine: Universe #{$universe->id} — collapse triggered. Reason: {$reason}. entropy={$entropy}, stability={$stability}");
        $this->executeCollapse($universe, $snapshot, $entropy, $stability, $reason);
        return true;
    }

    /**
     * Execute the collapse: fragment institutions, spawn new attractors, update fields.
     */
    protected function executeCollapse(Universe $universe, UniverseSnapshot $snapshot, float $entropy, float $stability, string $reason): void
    {
        $tick = $snapshot->tick;

        // 1. Get active institutions and cluster them
        $institutions = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $clusters = $this->clusterInstitutions($institutions->toArray());

        // 2. For each cluster, spawn a new collapse-fragment attractor instance
        foreach ($clusters as $clusterType => $members) {
            $childAttractorType = $this->mapClusterToAttractor($clusterType);
            DB::table('attractor_instances')->insert([
                'universe_id'    => $universe->id,
                'attractor_type' => $childAttractorType,
                'strength'       => 0.5 + (count($members) * 0.05),
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

        // 4. Update fields: post-collapse reset
        $uvec   = (array) ($universe->state_vector ?? []);
        $fields = (array) ($uvec['fields'] ?? []);

        $fields['power']     = max(0.0, ($fields['power'] ?? 0.5) - self::FIELD_POWER_PENALTY);
        $fields['stability'] = max(0.0, ($fields['stability'] ?? 0.5) - self::FIELD_STABILITY_DROP);
        $fields['survival']  = min(1.0, ($fields['survival'] ?? 0.5) + self::FIELD_SURVIVAL_BOOST);
        $fields['knowledge'] = max(0.0, ($fields['knowledge'] ?? 0.5) * (1.0 - self::FIELD_KNOWLEDGE_LOSS));
        // meaning field often rises after collapse — people search for meaning
        $fields['meaning']   = min(1.0, ($fields['meaning'] ?? 0.4) + 0.15);

        $uvec['fields'] = $fields;
        $uvec['collapse_at_tick'] = $tick;
        $this->universeRepository->update($universe->id, ['state_vector' => $uvec]);

        // 5. Chronicle the collapse
        $clusterSummary = implode(', ', array_keys($clusters));
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick'   => $tick,
            'to_tick'     => $tick,
            'type'        => 'civilization_collapse',
            'raw_payload' => [
                'action'          => 'collapse',
                'entropy'         => $entropy,
                'stability'       => $stability,
                'fragment_count'  => count($clusters),
                'fragment_types'  => $clusterSummary,
                'description'     => "Văn minh sụp đổ tại tick {$tick} do {$reason}. Entropy ({$entropy}) vượt ngưỡng ổn định ({$stability} × " . self::COLLAPSE_THRESHOLD . "). Các mảnh nổi lên: {$clusterSummary}.",
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
