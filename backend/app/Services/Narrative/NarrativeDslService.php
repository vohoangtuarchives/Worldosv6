<?php

namespace App\Services\Narrative;

use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Log;
use App\Models\TraitType;
use function resource_path;
use function app;

/**
 * NarrativeDslService: Cầu nối giữa Narrative layer và Rust Rule VM.
 * Dùng để đánh giá các đặc điểm (FateTags, Archetype Shift) của Agent bằng DSL.
 */
class NarrativeDslService
{
    protected ?string $fateDsl = null;
    protected ?string $archetypeDsl = null;

    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    /**
     * Đánh giá Agent và trả về các thay đổi (Fate Tags, New Archetype).
     */
    public function evaluateAgent(array $traits, string $currentArchetype): array
    {
        $state = [
            'traits' => $this->mapTraitsToNamedArray($traits),
            'current_archetype' => $currentArchetype,
        ];

        $dsl = $this->getCombinedDsl();
        
        // Giả lập một Universe câm (vì RuleVmService yêu cầu Universe/Snapshot cho apply, 
        // nhưng ở đây ta chỉ cần evaluate thô qua bridge client).
        // Tuy nhiên RuleVmService->evaluateAndApply là để chạy side-effect.
        // Ta sẽ dùng trực tiếp engine client từ RuleVmService để lấy outputs.
        
        $engine = $this->getEngine();
        $result = $engine->evaluateRules($state, $dsl);

        if (!($result['ok'] ?? false)) {
            Log::error('Narrative DSL evaluation failed', ['error' => $result['error_message'] ?? 'unknown']);
            return [
                'fate_tags' => [],
                'new_archetype' => $currentArchetype
            ];
        }

        return $this->parseOutputs($result['outputs'] ?? [], $currentArchetype);
    }

    protected function mapTraitsToNamedArray(array $traits): array
    {
        $out = [];
        // Trait Vector 17D
        for ($i = 0; $i < 17; $i++) {
            $val = $traits[$i] ?? 0.0;
            $label = strtolower(TraitType::label($i));
            if ($label !== 'unknown') {
                $out[$label] = $val;
            }
        }
        return $out;
    }

    protected function getCombinedDsl(): string
    {
        if ($this->fateDsl === null) {
            $this->fateDsl = @file_get_contents(resource_path('worldos_rules/legend/fate_tags.dsl')) ?: '';
        }
        if ($this->archetypeDsl === null) {
            $this->archetypeDsl = @file_get_contents(resource_path('worldos_rules/culture/archetypes.dsl')) ?: '';
        }

        return $this->fateDsl . "\n" . $this->archetypeDsl;
    }

    protected function getEngine()
    {
        // Phản chiếu thuộc tính protected của RuleVmService hoặc dùng container để lấy client
        return app(\App\Contracts\SimulationEngineClientInterface::class);
    }

    protected function parseOutputs(array $outputs, string $currentArchetype): array
    {
        $fateTags = [];
        $newArchetype = $currentArchetype;

        foreach ($outputs as $out) {
            $type = $out['type'] ?? '';
            
            // Theo Rust Engine: set_path { path: "fate_tags.the_conqueror", value: 1 }
            if ($type === 'set_path' && isset($out['set_path'])) {
                $path = $out['set_path'];
                if (str_starts_with($path, 'fate_tags.')) {
                    $tag = str_replace('fate_tags.', '', $path);
                    $fateTags[] = $this->formatTagHandle($tag);
                }
                if ($path === 'current_archetype') {
                    $newArchetype = $out['set_path_value'] ?? $currentArchetype;
                }
            }

            // Hoặc qua Event
            if ($type === 'event' && isset($out['event_name'])) {
                if (str_starts_with($out['event_name'], 'FATE_TAG_')) {
                    $fateTags[] = str_replace('FATE_TAG_', '', $out['event_name']);
                }
            }
        }

        return [
            'fate_tags' => array_values(array_unique($fateTags)),
            'new_archetype' => $newArchetype
        ];
    }

    protected function formatTagHandle(string $handle): string
    {
        // Chuyển snake_case thành Title Case (The_Conqueror -> The Conqueror)
        return ucwords(str_replace('_', ' ', $handle));
    }
}
