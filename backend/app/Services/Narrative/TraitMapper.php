<?php

namespace App\Services\Narrative;

use Illuminate\Support\Facades\Log;

/**
 * TraitMapper: Maps 18D Actor Traits to Narrative Descriptions, Fate Tags, and Monologues.
 * Based on ACTOR_TRAIT_VECTOR.md documentation.
 */
class TraitMapper
{
    /**
     * Generate an internal monologue seed based on dominant traits.
     */
    public function generateMonologueSeed(array $traits, string $archetype): string
    {
        if (empty($traits)) {
            return "Trình trạng trống rỗng. Mọi thứ mờ ảo.";
        }

        $dominantIndex = $this->getDominantTraitIndex($traits);
        
        $seeds = [
            0 => "Quyền lực là con đường duy nhất.", // Dominance
            1 => "Tôi phải vươn lên cao hơn nữa.", // Ambition
            2 => "Kẻ yếu phải tuân lệnh.", // Coercion
            3 => "Lòng trung thành là danh dự.", // Loyalty
            4 => "Tôi cảm nhận được nỗi đau của họ.", // Empathy
            5 => "Chúng ta mạnh mẽ hơn khi đứng cùng nhau.", // Solidarity
            6 => "Tốt hơn là nên làm theo số đông.", // Conformity
            7 => "Mọi thứ đều có cái giá của nó.", // Pragmatism
            8 => "Bí ẩn này dẫn đến đâu?", // Curiosity
            9 => "Chân lý đã được định sẵn.", // Dogmatism
            10 => "Rủi ro là một phần của cuộc chơi.", // RiskTolerance
            11 => "Bóng tối đang theo đuổi tôi.", // Fear
            12 => "Món nợ này phải được trả bằng máu.", // Vengeance
            13 => "Ngày mai sẽ tươi sáng hơn.", // Hope
            14 => "Nỗi buồn này không bao giờ dứt.", // Grief
            15 => "Tôi là đỉnh cao của sự tồn tại.", // Pride
            16 => "Tôi không xứng đáng với điều này.", // Shame
            17 => "Thời gian đang cạn dần.", // Longevity
        ];

        $thought = $seeds[$dominantIndex] ?? "Định mệnh đang gọi tên...";
        
        return "[$archetype] \"$thought\"";
    }

    /**
     * Map trait vector to a text description.
     */
    public function mapToDescription(array $traits): string
    {
        $descriptions = [];
        
        if (($traits[0] ?? 0) > 0.7) $descriptions[] = "khát khao thống trị";
        if (($traits[1] ?? 0) > 0.7) $descriptions[] = "tham vọng lớn lao";
        if (($traits[2] ?? 0) > 0.7) $descriptions[] = "thích dùng quyền lực";
        if (($traits[4] ?? 0) > 0.7) $descriptions[] = "trắc ẩn";
        if (($traits[5] ?? 0) > 0.7) $descriptions[] = "hướng về cộng đồng";
        if (($traits[11] ?? 0) > 0.7) $descriptions[] = "luôn sợ hãi";
        if (($traits[12] ?? 0) > 0.7) $descriptions[] = "đầy lòng thù hận";
        if (($traits[13] ?? 0) > 0.7) $descriptions[] = "tràn đầy hy vọng";

        if (empty($descriptions)) {
            return "Một linh hồn bình thường trong dòng chảy vũ trụ.";
        }

        return "Một kẻ " . implode(", ", $descriptions) . ".";
    }

    /**
     * Get Fate Tags based on trait combinations.
     */
    public function getFateTags(array $traits): array
    {
        $tags = [];
        
        $dominance = $traits[0] ?? 0;
        $ambition = $traits[1] ?? 0;
        $empathy = $traits[4] ?? 0;
        $curiosity = $traits[8] ?? 0;
        $dogmatism = $traits[9] ?? 0;
        $vengeance = $traits[12] ?? 0;
        $hope = $traits[13] ?? 0;
        $pragmatism = $traits[7] ?? 0;

        if ($dominance > 0.8 && $ambition > 0.8) $tags[] = "The Conqueror";
        if ($empathy > 0.8 && $hope > 0.8) $tags[] = "The Messiah";
        if ($curiosity > 0.9) $tags[] = "The Void-Seeker";
        if ($vengeance > 0.85) $tags[] = "The Avenger";
        if ($dogmatism > 0.85) $tags[] = "The Inquisitor";
        
        if ($pragmatism > 0.8 && $curiosity > 0.7 && $dogmatism < 0.3) {
            $tags[] = "Awareness_of_the_Clock";
            $tags[] = "Simulation_Skepticism";
        }

        return $tags;
    }

    /**
     * Legacy method for archetype detection (mostly replaced by ArchetypeClassifier).
     */
    public function detectArchetypeShift(array $traits, string $currentArchetype): ?string
    {
        $ambition = $traits[1] ?? 0;
        $coercion = $traits[2] ?? 0;
        $empathy = $traits[4] ?? 0;
        $pragmatism = $traits[7] ?? 0;
        $curiosity = $traits[8] ?? 0;
        $dogmatism = $traits[9] ?? 0;

        if ($currentArchetype === 'Commoner') {
            if ($ambition > 0.7) return 'Opportunist';
            if ($empathy > 0.7) return 'Sage';
        }

        if ($currentArchetype === 'Opportunist') {
            if ($coercion > 0.7) return 'Warlord';
            if ($pragmatism > 0.8) return 'Merchant_Lord';
        }

        if ($currentArchetype === 'Sage') {
            if ($dogmatism > 0.7) return 'High_Priest';
            if ($curiosity > 0.8) return 'Scholar';
        }

        if ($dogmatism > 0.9) return 'Zealot';

        return null;
    }

    protected function getDominantTraitIndex(array $traits): int
    {
        $maxVal = -1.0;
        $maxIdx = 0;
        
        foreach ($traits as $idx => $val) {
            if ($val > $maxVal) {
                $maxVal = $val;
                $maxIdx = $idx;
            }
        }
        
        return $maxIdx;
    }
}
