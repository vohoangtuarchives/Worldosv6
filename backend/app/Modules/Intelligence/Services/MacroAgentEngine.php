<?php

namespace App\Modules\Intelligence\Services;

use App\Models\Universe;
use App\Modules\Intelligence\Entities\ActorState;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use Illuminate\Support\Facades\Log;

/**
 * Phase 51: Macro Agent Personification Engine ⚔️👤
 * 
 * Linh hồn cho Macro Agents: Kết nối Vĩ nhân với Quân đoàn và Người trị vì.
 */
class MacroAgentEngine
{
    public function __construct(
        protected ActorRepositoryInterface $actorRepository
    ) {}

    /**
     * Cập nhật trạng thái của các Macro Agents dựa trên tình trạng của Leader.
     */
    public function step(Universe $universe): void
    {
        $stateVector = $universe->state_vector;
        $agents = $stateVector['macro_agents'] ?? [];
        $changed = false;

        foreach ($agents as $idx => &$agent) {
            if (!isset($agent['leader_id'])) {
                $this->searchLeaderForAgent($agent, $universe);
                $changed = true;
            }

            if (isset($agent['leader_id'])) {
                if (!$this->isLeaderAlive($agent['leader_id'], $universe)) {
                    $this->handleLeaderDeath($agent, $idx, $universe);
                    $changed = true;
                } else {
                    $this->updateAgentStatsFromLeader($agent, $universe);
                    $changed = true;
                }
            }
        }

        if ($changed) {
            $stateVector['macro_agents'] = $agents;
            $universe->state_vector = $stateVector;
        }
    }

    /**
     * Tìm kiếm một Vĩ nhân phù hợp để dẫn dắt Macro Agent.
     */
    public function searchLeaderForAgent(array &$agent, Universe $universe): void
    {
        $heroes = $this->actorRepository->findByUniverse($universe->id);

        foreach ($heroes as $hero) {
            if (!$hero->isAlive || !$hero->isHeroic) {
                continue;
            }
            $type = $hero->heroicType;
            // Khớp loại Hero với loại Macro Agent
            if ($agent['type'] === 'army' && $type === 'GENERAL') {
                $agent['leader_id'] = $hero->id;
                $agent['leader_name'] = $hero->name;
                Log::info("MACRO PERSONIFIED: {$hero->name} has taken command of a Macro Army in Zone {$agent['zone_id']}");
                return;
            }
            if ($agent['type'] === 'ruler' && ($type === 'RULER' || $type === 'PROPHET')) {
                $agent['leader_id'] = $hero->id;
                $agent['leader_name'] = $hero->name;
                Log::info("MACRO PERSONIFIED: {$hero->name} has become the Macro Ruler of Zone {$agent['zone_id']}");
                return;
            }
        }
    }

    private function isLeaderAlive(int $leaderId, Universe $universe): bool
    {
        $leader = $this->actorRepository->find($leaderId);
        return $leader && $leader->isAlive;
    }

    private function handleLeaderDeath(array &$agent, int $index, Universe $universe): void
    {
        Log::warning("MACRO COLLAPSE: Leader {$agent['leader_name']} has fallen! The {$agent['type']} is in disarray.");
        
        // Giảm sức mạnh đột ngột (Panic effect)
        $agent['strength'] *= 0.3;
        $agent['morale'] = 0.1;
        unset($agent['leader_id']);
        unset($agent['leader_name']);
        
        // Có xác suất tan rã hoàn toàn
        if (rand(0, 100) < 50) {
            $agent['collapsed'] = true;
            Log::info("MACRO DISSOLVED: The {$agent['type']} has completely dissolved following the leader's death.");
        }
    }

    private function updateAgentStatsFromLeader(array &$agent, Universe $universe): void
    {
        $leader = $this->actorRepository->find($agent['leader_id']);
        if (!$leader) return;

        $traits = $leader->traits;
        $dominance = $traits['Dominance'] ?? 0.5;
        $ambition = $traits['Ambition'] ?? 0.5;

        // Sức mạnh tỷ lệ thuận với khả năng chỉ huy
        $baseStrength = $agent['strength'] ?? 0.5;
        $agent['strength'] = round(($baseStrength * 0.7) + ($dominance * 0.3), 3);
        $agent['morale'] = round(($ambition * 0.8) + ($dominance * 0.2), 3);
    }
}
