<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * Phase 25: Meaning Systems 🧘‍♂️📖
 * 
 * "Diễn giải thực tại thông qua các Framework ý nghĩa: Tôn giáo, Triết học, Hệ tư tưởng."
 */
class MeaningEngine
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
        $rng = new \App\Modules\Intelligence\Domain\Rng\SimulationRng($seed, $tick, 888); // Magic number for Meaning

        $activeMyths = $state->get('meta.active_myths', []);
        $meaningSystems = $state->get('meta.meaning_systems', []);
        $socialUnrest = (float)$state->get('meta.social_unrest', 0);

        // 1. Sinh ra Meaning System mới nếu có Myth mạnh và bất ổn xã hội cao
        if ($socialUnrest > 0.6 && count($activeMyths) > 0 && count($meaningSystems) < 8) {
            $coreMyth = $activeMyths[$rng->nextInt(0, count($activeMyths) - 1)];
            
            // 50% là tôn giáo, 50% là triết học/hệ tư tưởng
            if ($rng->nextFloat() < 0.5) {
                $this->spawnReligion($universeId, $coreMyth, $tick, $meaningSystems);
            } else {
                $this->spawnIdea($universeId, $coreMyth, $tick, $meaningSystems);
            }
        }

        // 2. Cập nhật và tiến hóa các hệ thống ý nghĩa
        foreach ($meaningSystems as &$system) {
            $system['influence'] = min(1.0, ($system['influence'] ?? 0.1) + ($rng->nextFloat() * 0.01));
            $system['coherence'] *= 0.998; // Suy tàn tự nhiên của sự nhất quán
        }

        $state->set('meta.meaning_systems', $meaningSystems);

        // 3. DSL Layer: Áp dụng quy tắc từ meaning.dsl
        $this->applyDslRules($state, $tick);
    }

    private function spawnReligion(int $universeId, array $myth, int $tick, array &$meaningSystems): void
    {
        $religion = \App\Models\Religion::create([
            'universe_id' => $universeId,
            'name' => "Tín ngưỡng " . $myth['archetype'],
            'origin_myth_id' => $myth['id'],
            'doctrine' => "Dựa trên huyền thoại {$myth['archetype']}.",
            'spread_rate' => 0.01,
            'followers' => 100,
        ]);

        $meaningSystems[] = [
            'id' => 'rel_' . $religion->id,
            'type' => 'RELIGION',
            'influence' => 0.1,
            'coherence' => 0.8,
            'db_id' => $religion->id,
        ];

        Log::info("Meaning Engine: A new religion has emerged.", ['name' => $religion->name]);
    }

    private function spawnIdea(int $universeId, array $myth, int $tick, array &$meaningSystems): void
    {
        $idea = \App\Models\Idea::create([
            'universe_id' => $universeId,
            'theme' => "Triết học " . $myth['archetype'],
            'info_type' => 'religion', // Sử dụng religion type cho ideologies
            'influence_score' => 0.1,
            'followers' => 50,
            'birth_tick' => $tick,
        ]);

        $meaningSystems[] = [
            'id' => 'idea_' . $idea->id,
            'type' => 'IDEOLOGY',
            'influence' => 0.1,
            'coherence' => 0.7,
            'db_id' => $idea->id,
        ];

        Log::info("Meaning Engine: A new ideology has emerged.", ['theme' => $idea->theme]);
    }

    private function applyDslRules(WorldState $state, int $tick): void
    {
        $this->ruleVm->evaluateAndApplyWithState(
            $state,
            'culture/meaning.dsl',
            $tick,
            ['mode' => 'MEANING_ENHANCEMENT']
        );
    }
}
