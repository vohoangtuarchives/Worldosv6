<?php

namespace App\Actions\Simulation;

use App\Models\MythScar;
use App\Models\Universe;
use App\Models\UniverseSnapshot;

class ApplyMythScarAction
{
    public function __construct(
        protected \App\Contracts\GraphProviderInterface $graphProvider,
        protected \App\Services\Simulation\RuleVmService $ruleVm
    ) {}

    /**
     * Tự động sinh một Vết Sẹo (Myth Scar) hoặc Di sản (Heritage) dựa trên Rule VM.
     */
    public function execute(Universe $universe, UniverseSnapshot $savedSnapshot, array $decisionData): void
    {
        $eventType = $decisionData['event_type'] ?? 'GENERIC';
        $intensity = (float) ($decisionData['intensity'] ?? 0.5);
        $causalDebt = (float) ($savedSnapshot->state_vector['causal_integrity_debt'] ?? 0.0);

        $rawState = [
            'event_type' => $eventType,
            'event_intensity' => $intensity,
            'causal_integrity_debt' => $causalDebt,
            'field_knowledge_field' => (float) ($savedSnapshot->state_vector['fields']['knowledge_field'] ?? 0.5),
            'current_scars_count' => MythScar::where('universe_id', $universe->id)->whereNull('resolved_at_tick')->count(),
        ];

        $dslFile = \resource_path('worldos_rules/legend/chronicles.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';
        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);

        if (!($result['ok'] ?? false)) {
            return;
        }

        foreach ($result['outputs'] ?? [] as $output) {
            if ($output['type'] === 'event' && $output['event_name'] === 'CREATE_WORLD_SCAR') {
                $this->createMythScar($universe, $output['data']);
            }
            // Logic for CREATE_HERITAGE can be added here
        }
    }

    private function createMythScar(Universe $universe, array $data): void
    {
        $scar = MythScar::create([
            'universe_id'      => $universe->id,
            'zone_id'          => 'Global',
            'name'             => $data['type'] . " Scar",
            'description'      => "Dấu ấn lịch sử: " . ($data['type'] ?? 'Unknown'),
            'severity'         => (float) ($data['weight'] ?? 0.5),
            'decay_rate'       => 0.005,
            'created_at_tick'  => $universe->current_tick,
        ]);

        $this->graphProvider->sync($universe->id, [
            'type' => 'MythScar',
            'model' => $scar
        ]);
    }
}
