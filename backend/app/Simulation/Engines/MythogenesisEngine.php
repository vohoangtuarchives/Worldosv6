<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 24: Mythogenesis Engine 🎭✨
 * 
 * "Mọi chi tiết của cả vũ trụ đều nằm trong mỗi mảnh dữ liệu."
 * Mô phỏng quá trình Sự kiện -> Câu chuyện -> Niềm tin -> Biểu tượng.
 * Biến các biến cố lớn thành "Linh hồn văn hóa".
 */
class MythogenesisEngine
{
    public function __construct(
        private readonly \App\Services\Simulation\RuleVmService $ruleVm
    ) {}

    /**
     * @param WorldState $state
     * @param int $tick
     */
    public function run(WorldState $state, int $tick): void
    {
        $universeId = (int)$state->get('universe_id');
        $seed = (int)$state->get('seed', 0);
        $rng = new \App\Modules\Intelligence\Domain\Rng\SimulationRng($seed, $tick, 777); // Magic number for Mythogenesis

        // 1. Lấy các sự kiện gần đây (Chronicles) từ state hoặc DB
        // Chúng ta giả định HistoricalFact chứa các sự kiện quan trọng
        $recentFacts = \App\Models\HistoricalFact::where('universe_id', $universeId)
            ->where('tick', $tick)
            ->get();

        $activeMyths = $state->get('meta.active_myths', []);

        foreach ($recentFacts as $fact) {
            $impact = $this->calculateImpact($fact);
            
            // Nếu tác động vượt ngưỡng, bắt đầu quá trình thần thoại hóa
            if ($impact > 0.75) {
                $archetype = $this->determineArchetype($fact, $rng);
                $myth = \App\Models\Myth::create([
                    'universe_id' => $universeId,
                    'myth_type' => $archetype,
                    'story' => $this->generateStory($fact, $archetype),
                    'source_events' => [$fact->id],
                    'impact' => $impact,
                ]);

                $activeMyths[] = [
                    'id' => $myth->id,
                    'archetype' => $archetype,
                    'belief_strength' => 0.5,
                    'symbolic_power' => $impact,
                ];

                Log::info("Mythogenesis: A new myth has been born from Fact #{$fact->id}", ['archetype' => $archetype]);
            }
        }

        // 2. Myth Evolution & Decay
        foreach ($activeMyths as &$m) {
            // Sử dụng RNG để mô phỏng sự biến đổi câu chuyện (Story Drift)
            if ($rng->nextFloat() < 0.05) {
                $m['symbolic_power'] *= 1.05;
                $m['belief_strength'] = min(1.0, $m['belief_strength'] + 0.02);
            }

            // Suy tàn tự nhiên
            $m['belief_strength'] *= 0.995;
        }

        $state->set('meta.active_myths', $activeMyths);

        // 3. DSL Layer: Áp dụng quy tắc từ myth.dsl (Nếu có)
        $this->applyDslRules($state, $tick);
    }

    private function calculateImpact(\App\Models\HistoricalFact $fact): float
    {
        // Impact dựa trên số lượng actor bị ảnh hưởng và danh mục sự kiện
        $actorCount = count($fact->actors ?? []);
        $baseImpact = match($fact->category) {
            'WAR' => 0.6,
            'DISCOVERY' => 0.5,
            'RELIGION' => 0.7,
            'CRISIS' => 0.8,
            default => 0.3
        };

        return min(1.0, $baseImpact + ($actorCount / 1000));
    }

    private function determineArchetype(\App\Models\HistoricalFact $fact, $rng): string
    {
        $archetypes = ['HERO', 'MARTYR', 'CREATOR', 'DESTROYER', 'OIKOS'];
        
        if ($fact->category === 'WAR') return 'MARTYR';
        if ($fact->category === 'DISCOVERY') return 'CREATOR';
        
        return $archetypes[$rng->nextInt(0, count($archetypes) - 1)];
    }

    private function generateStory(\App\Models\HistoricalFact $fact, string $archetype): string
    {
        // Placeholder cho việc generate story (Sau này có thể tích hợp AI)
        return "Huyền thoại về một {$archetype} xuất hiện từ sự kiện {$fact->category} tại Tick #{$fact->tick}.";
    }

    private function applyDslRules(WorldState $state, int $tick): void
    {
        $this->ruleVm->evaluateAndApplyWithState(
            $state,
            'culture/myth.dsl',
            $tick,
            ['mode' => 'MYTH_GENERATION']
        );
    }
}
