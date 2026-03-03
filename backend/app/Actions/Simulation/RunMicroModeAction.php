<?php

namespace App\Actions\Simulation;

use App\Models\BranchEvent;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Str;

use App\Domain\Simulation\Actors\ActorRegistry;

class RunMicroModeAction
{
    private const NAMES = ['Kael', 'Valeria', 'Zeth', 'Lysandra', 'Titus', 'Orik', 'Sera', 'Magnus', 'Elena', 'Xal-Thun', 'C0-DE', 'Archon-7'];

    public function __construct(
        protected ApplyMythScarAction $applyMythScarAction,
        protected ActorRegistry $actorRegistry
    ) {}

    /**
     * Kích hoạt chế độ vi mô. Sinh ra các đặc vụ, tính toán điểm số và quyết định nhánh lịch sử.
     *
     * @return array Trả về thông tin Micro Crisis nếu có xảy ra
     */
    public function execute(Universe $universe, UniverseSnapshot $snapshot, array $decisionData = []): ?array
    {
        // 1. Kiểm tra điều kiện (Nếu Stability quá thấp, vào ngưỡng Micro Mode)
        // Ví dụ: Ngưỡng 0.3
        $stability = $snapshot->stability_index ?? 1.0;
        if ($stability > 0.3) {
            return null; // Quá ổn định, không có Micro Crisis
        }

        // 2. Spawn 3-5 Agents phù hợp với thế giới
        $eligibleArchetypes = $this->actorRegistry->getEligibleArchetypes($universe->world);
        if (empty($eligibleArchetypes)) {
            return null;
        }

        $numAgents = rand(3, 5);
        $agents = [];
        
        for ($i = 0; $i < $numAgents; $i++) {
            $agents[] = $this->generateAgent($eligibleArchetypes);
        }

        // 3. Tính toán Agent chiến thắng dựa vào ActionUtility
        // ActionUtility = BaseScore + T17 * ContextWeight + Noise
        
        $contextWeight = $this->generateContextWeight($snapshot);
        $winner = null;
        $maxUtility = -999.0;

        foreach ($agents as &$agent) {
            $archetypeObj = $agent['archetype_object'];
            $baseScore = $archetypeObj->getBaseUtility($stability);
            $t17Score = 0;
            
            for ($d = 0; $d < 17; $d++) {
                $t17Score += $agent['traits'][$d] * $contextWeight[$d];
            }
            
            $noise = (rand(-100, 100) / 100.0) * 0.2; // +/- 0.2
            
            $utility = $baseScore + $t17Score + $noise;
            $agent['utility'] = $utility;

            if ($utility > $maxUtility) {
                $maxUtility = $utility;
                $winner = $agent;
            }
        }

        if (!$winner) {
            return null;
        }

        // 4. Áp dụng hậu quả vào Macro State dựa trên Hệ phái (Archetype) của kẻ thắng
        $outcome = $winner['archetype_object']->applyImpact($universe, $snapshot, $winner);

        // 5. Ghi nhận sự kiện vào BranchEvent
        $payload = [
            'winner' => $winner,
            'participants' => array_map(fn($a) => ['name' => $a['name'], 'archetype' => $a['archetype']], $agents),
            'outcome' => $outcome,
            'stability_at_time' => $stability
        ];

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick'   => $universe->current_tick,
            'event_type'  => 'micro_crisis',
            'payload'     => $payload,
        ]);

        return $payload;
    }

    private function generateAgent(array $eligibleArchetypes): array
    {
        $traits = [];
        for ($i = 0; $i < 17; $i++) {
            $traits[] = rand(0, 1000) / 1000.0; // Random [0,1]
        }

        $archetype = $eligibleArchetypes[array_rand($eligibleArchetypes)];

        return [
            'id' => Str::uuid()->toString(),
            'name' => self::NAMES[array_rand(self::NAMES)],
            'archetype' => $archetype->getName(),
            'archetype_object' => $archetype,
            'traits' => $traits,
            // (Dominance, Ambition, Coercion, Loyalty, Empathy, Solidarity, Conformity, Pragmatism, Curiosity, Dogmatism, RiskTolerance, Fear, Vengeance, Hope, Grief, Pride, Shame)
        ];
    }

    private function generateContextWeight(UniverseSnapshot $snapshot): array
    {
        $entropy = $snapshot->entropy ?? 0.5;
        $stability = $snapshot->stability_index ?? 0.5;
        
        $w = array_fill(0, 17, 0.0);

        // 0-2: Quyền lực (Dominance, Ambition, Coercion)
        // Có lợi thế khi ổn định thấp hoặc entropy cao
        for($i=0; $i<=2; $i++) $w[$i] = (1.0 - $stability) * 1.2 + ($entropy * 0.5);

        // 3-6: Xã hội (Loyalty, Empathy, Solidarity, Conformity)
        // Có lợi thế khi ổn định cao và entropy thấp
        for($i=3; $i<=6; $i++) $w[$i] = $stability * 1.5 - ($entropy * 0.3);

        // 7-10: Nhận thức (Pragmatism, Curiosity, Dogmatism, RiskTolerance)
        // Pragmatism/Curiosity cần ổn định vừa phải, RiskTolerance cần entropy cao
        $w[7] = 0.5 + (1.0 - $entropy) * 0.5; // Pragmatism
        $w[8] = 0.4 + (1.0 - $entropy) * 0.6; // Curiosity
        $w[9] = $stability * 1.2;            // Dogmatism
        $w[10] = $entropy * 1.8;             // RiskTolerance

        // 11-16: Cảm xúc (Fear, Vengeance, Hope, Grief, Pride, Shame)
        $w[11] = $entropy * 2.0;             // Fear bùng nổ khi hỗn loạn
        $w[12] = (1.0 - $stability) * 1.5;   // Vengeance khi bất ổn
        $w[13] = $stability * 1.0;            // Hope
        $w[14] = $entropy * 0.5;             // Grief
        $w[15] = $stability * 0.8;           // Pride
        $w[16] = (1.0 - $stability) * 0.6;   // Shame

        return $w;
    }
}
