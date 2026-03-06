<?php

namespace App\Services\Simulation;

use App\Models\Universe;

/**
 * KernelMutationService – Quản lý "Genotype" của Thiên Đạo (Universe Kernel)
 * 
 * Mỗi vũ trụ có một bộ thông số vận hành (Genome).
 * Khi Fork, genome có thể bị đột biến (Mutation) hoặc kết hợp (Recombination).
 */
class KernelMutationService
{
    private const DEFAULT_GENOME = [
        'diffusion_rate' => 0.1,      // Tốc độ lan truyền các trường
        'entropy_coefficient' => 1.0,  // Hệ số sinh entropy
        'mutation_rate' => 0.05,       // Tỉ lệ đột biến của genome này
        'attractor_gravity' => 1.0,    // Sức hút của các Attractor Fields
        'complexity_bonus' => 1.0,     // Hệ số thưởng cho tri thức/văn minh
    ];

    /**
     * Khởi tạo genome mặc định cho vũ trụ nếu chưa có.
     */
    public function ensureGenome(Universe $universe): void
    {
        if (!$universe->kernel_genome) {
            $universe->kernel_genome = self::DEFAULT_GENOME;
            $universe->save();
        }
    }

    /**
     * Tạo một genome mới dựa trên genome của parent với đột biến.
     */
    public function mutate(array $parentGenome): array
    {
        $childGenome = $parentGenome;
        $mutationRate = $parentGenome['mutation_rate'] ?? 0.05;

        foreach ($childGenome as $key => $value) {
            if (rand(0, 1000) / 1000 < $mutationRate) {
                // Đột biến +/- 20% giá trị hiện tại
                $factor = 0.8 + (rand(0, 400) / 1000);
                $childGenome[$key] = round($value * $factor, 4);
                
                // Clamp giá trị (hầu hết [0, 2])
                if ($key !== 'complexity_bonus' && $key !== 'attractor_gravity') {
                    $childGenome[$key] = max(0.001, min(1.0, $childGenome[$key]));
                } else {
                    $childGenome[$key] = max(0.001, min(5.0, $childGenome[$key]));
                }
            }
        }

        return $childGenome;
    }

    /**
     * Tính toán Fitness Score cho vũ trụ để đánh giá "sức sống bản ngã" (Seleciton phase).
     */
    public function calculateFitness(Universe $universe): float
    {
        $metrics = $universe->state_vector['metrics'] ?? [];
        
        $order = 1.0 - ($universe->entropy ?? 0.5);
        $knowledge = $metrics['knowledge_core'] ?? 0.1;
        $stability = $universe->structural_coherence ?? 0.5;
        
        // Fitness = f(Order, Knowledge, Stability)
        $score = ($order * 0.3) + ($knowledge * 0.5) + ($stability * 0.2);
        
        return round($score, 4);
    }
}
