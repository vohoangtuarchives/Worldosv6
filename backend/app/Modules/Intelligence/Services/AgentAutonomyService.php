<?php

namespace App\Modules\Intelligence\Services;

use App\Models\Universe;
use App\Models\AgentDecision;
use App\Models\SocialContract;
use App\Models\Chronicle;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Entities\ActorEntity;
use Illuminate\Support\Facades\DB;

class AgentAutonomyService
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository
    ) {}
    protected array $actionWeights = [
        'form_contract' => [
            'Solidarity' => 0.8,
            'Loyalty' => 0.6,
            'Empathy' => 0.5,
            'Fear' => 0.4,
            'Ambition' => -0.3,
        ],
        'revolt' => [
            'Ambition' => 0.7,
            'Coercion' => 0.6,
            'Vengeance' => 0.8,
            'Fear' => -0.5,
            'Dominance' => 0.6,
        ],
        'migrate' => [
            'Curiosity' => 0.7,
            'RiskTolerance' => 0.8,
            'Hope' => 0.5,
            'Fear' => 0.6,
        ],
        'trade' => [
            'Pragmatism' => 0.9,
            'Solidarity' => 0.4,
            'Ambition' => 0.5,
        ],
        'suppress_revolt' => [
            'Dominance' => 0.8,
            'Coercion' => 0.7,
            'Loyalty' => 0.5,
            'Empathy' => -0.4,
        ],
        'propagate_myth' => [
            'Dogmatism' => 0.8,
            'Hope' => 0.6,
            'Pride' => 0.5,
            'Pragmatism' => -0.3,
        ]
    ];

    public function process(Universe $universe, int $tick): void
    {
        $actors = $this->actorRepository->findByUniverse($universe->id);
        $globalEntropy = (float)($universe->state_vector['entropy'] ?? 0.0);

        foreach ($actors as $actor) {
            $decision = $this->makeDecision($actor, $globalEntropy);
            if ($decision) {
                $this->applyDecision($actor, $decision, $universe, $tick);
            }
        }
    }

    protected function makeDecision(ActorEntity $actor, float $globalEntropy): ?array
    {
        $traits = $actor->traits; 
        $dimensions = ActorEntity::TRAIT_DIMENSIONS;
        
        $utilities = [];
        foreach ($this->actionWeights as $action => $weights) {
            $score = 0.5; // Base score
            
            if ($action === 'revolt' && $globalEntropy > 0.6) $score += 0.3;
            if ($action === 'form_contract' && $globalEntropy > 0.7) $score += 0.4;
            if ($action === 'migrate' && $globalEntropy > 0.8) $score += 0.5;

            foreach ($weights as $traitName => $weight) {
                $index = array_search($traitName, $dimensions);
                if ($index !== false && isset($traits[$index])) {
                    $score += ($traits[$index] * $weight);
                }
            }
            $score += (rand(-10, 10) / 100);
            $utilities[$action] = $score;
        }

        arsort($utilities);
        $bestAction = key($utilities);
        $bestScore = current($utilities);

        if ($bestScore > 1.2) {
            return [
                'type' => $bestAction,
                'score' => $bestScore,
                'traits' => $traits
            ];
        }

        return null;
    }

    protected function applyDecision(ActorEntity $actor, array $decision, Universe $universe, int $tick): void
    {
        $impact = [];
        $vec = $universe->state_vector ?? [];

        switch ($decision['type']) {
            case 'revolt':
                $vec['entropy'] = min(1.0, ($vec['entropy'] ?? 0) + 0.05);
                $vec['stability_index'] = max(0.0, ($vec['stability_index'] ?? 1) - 0.05);
                $impact = ['entropy' => '+0.05', 'stability' => '-0.05'];
                $this->handleRevolt($actor, $universe, $tick);
                break;
            case 'form_contract':
                $vec['entropy'] = max(0.0, ($vec['entropy'] ?? 0) - 0.02);
                $vec['stability_index'] = min(1.0, ($vec['stability_index'] ?? 0) + 0.03);
                $impact = ['entropy' => '-0.02', 'stability' => '+0.03', 'contract' => 'created'];
                $this->handleSocialContract($actor, $universe, $tick);
                break;
            case 'migrate':
                $actor->biography .= "\n- T{$tick}: Quyết định dời bước khỏi chốn cũ, tìm kiếm chân trời mới.";
                $this->actorRepository->save($actor);
                break;
            case 'propagate_myth':
                $currentMyth = $vec['metrics']['myth_intensity'] ?? 0;
                $vec['metrics']['myth_intensity'] = min(1.0, $currentMyth + 0.05);
                $impact = ['myth_intensity' => '+0.05'];
                Chronicle::create([
                    'universe_id' => $universe->id,
                    'from_tick' => $tick,
                    'to_tick' => $tick,
                    'type' => 'myth',
                    'raw_payload' => [
                    'action' => 'legacy_event',
                    'description' => "{$actor->name} truyền bá đức tin cổ xưa, củng cố sợi dây liên kết vô hình."
                ]
                ]);
                break;
        }
        
        $universe->update(['state_vector' => $vec]);

        AgentDecision::create([
            'actor_id' => $actor->id,
            'universe_id' => $universe->id,
            'tick' => $tick,
            'action_type' => $decision['type'],
            'utility_score' => $decision['score'],
            'traits_snapshot' => $decision['traits'],
            'meta' => $impact
        ]);
    }

    protected function handleSocialContract(ActorEntity $actor, Universe $universe, int $tick): void
    {
        $others = $this->actorRepository->findByUniverse($universe->id);
        $others = array_filter($others, fn($o) => $o->id != $actor->id && $o->isAlive);
        $others = array_slice($others, 0, 3);

        if (empty($others)) return;

        $participants = array_map(fn($o) => $o->id, $others);
        $participants[] = $actor->id;

        SocialContract::create([
            'universe_id' => $universe->id,
            'type' => 'mutual_defense',
            'participants' => $participants,
            'strictness' => (rand(30, 80) / 100),
            'duration' => 100,
            'created_at_tick' => $tick,
            'expires_at_tick' => $tick + 100,
        ]);

        $names = implode(', ', array_map(fn($o) => $o->name, $others));
        $actor->biography .= "\n- T{$tick}: Ký kết giao ước liên thủ với {$names}.";
        $this->actorRepository->save($actor);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'social_contract',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "GIAO ƯỚC MỚI: {$actor->name} và các đồng minh thiết lập một khế ước tương trợ, đặt nền móng cho trật tự mới."
            ],
        ]);
    }

    protected function handleRevolt(ActorEntity $actor, Universe $universe, int $tick): void
    {
        $actor->biography .= "\n- T{$tick}: Bùng nổ nộ khí, công khai phản kháng lại trật tự hiện hành.";
        $this->actorRepository->save($actor);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'revolt',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "BIẾN LOẠN: {$actor->name} công khai phản kháng, tạo ra một cơn sóng bất ổn lan rộng."
            ],
        ]);
    }
}
