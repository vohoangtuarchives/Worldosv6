<?php

namespace App\Services\AI;

use App\Models\Universe;
use App\Models\DiscoveredAxiom;
use App\Services\Narrative\PerceivedArchiveBuilder;
use Illuminate\Support\Facades\Log;

/**
 * Theory Synthesis Service: Analyzes perceived data to propose new Axioms.
 * Part of WorldOS V7: The Epistemic Breach.
 */
class TheorySynthesisService
{
    public function __construct(
        protected PerceivedArchiveBuilder $archiveBuilder,
        protected AnalyticalAiService $ai
    ) {}

    /**
     * Analyze a universe's history and propose a potential new Axiom.
     */
    public function synthesizeTheory(Universe $universe): ?DiscoveredAxiom
    {
        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        if (!$latest) return null;

        // Rate limit guard: tránh spam Axiom, chỉ sinh mới khi ít nhất 50 ticks trôi qua
        $lastAxiom = DiscoveredAxiom::where('universe_id', $universe->id)
            ->orderByDesc('tick_discovered')
            ->first();
        if ($lastAxiom && ($latest->tick - $lastAxiom->tick_discovered) < 50) {
            Log::debug("TheorySynthesisService: Rate limited for Universe {$universe->id}.");
            return null;
        }

        // Build a highly "Obscure" context to force AI intuition
        $context = $this->archiveBuilder->build(
            $universe->id, 
            ['theory_discovery'], 
            $latest->state_vector, 
            $latest->tick
        );

        $prompt = $this->buildDiscoveryPrompt($context);
        $proposal = $this->ai->generateStructuredProposal($prompt);

        if (!$proposal || empty($proposal['axiom_key'])) {
            return null;
        }

        return DiscoveredAxiom::create([
            'universe_id' => $universe->id,
            'tick_discovered' => $latest->tick,
            'axiom_key' => $proposal['axiom_key'],
            'description' => $proposal['description'],
            'hypothesized_effect' => $proposal['effect'],
            'confidence' => $proposal['confidence'] ?? 0.5,
            'status' => 'proposed'
        ]);
    }

    protected function buildDiscoveryPrompt(array $context): string
    {
        $existence = $context['existence']['name'] ?? 'Unknown';
        $stability = $context['metrics']['reality_stability'] ?? 0;
        
        return "BỐI CẢNH THỰC TẠI: $existence (Độ ổn định: $stability)\n" .
               "DỮ LIỆU NHẬN THỨC: " . json_encode($context['flavor']) . "\n" .
               "NHIỆM VỤ: Hãy tìm ra một quy luật ẩn (Axiom) đang điều khiển vũ trụ này.\n" .
               "YÊU CẦU: Đề xuất một mã Axiom (ví dụ: 'void_resonance') và mô tả hiệu ứng của nó lên Entropy hoặc SCI.";
    }
}
