<?php

namespace App\Services\Narrative;

class TraitMapper
{
    /**
     * Chuyển đổi TraitVector 17D thành mô tả tự nhiên (§51.2).
     */
    public function mapToDescription(array $traits): string
    {
        $desc = [];

        // 0-2: Dominance, Ambition, Coercion
        if ($traits[0] > 0.7) $desc[] = "khát khao thống trị";
        if ($traits[1] > 0.7) $desc[] = "tham vọng lớn lao";
        if ($traits[2] > 0.7) $desc[] = "thích dùng quyền lực";

        // 3-6: Loyalty, Empathy, Solidarity, Conformity
        if ($traits[4] > 0.8) $desc[] = "giàu lòng trắc ẩn";
        if ($traits[5] > 0.8) $desc[] = "luôn hướng về cộng đồng";
        if ($traits[6] > 0.8) $desc[] = "dễ bị khuất phục bởi đám đông";

        // 7-10: Pragmatism, Curiosity, Dogmatism, RiskTolerance
        if ($traits[7] > 0.7) $desc[] = "thực dụng và tỉnh táo";
        if ($traits[8] > 0.7) $desc[] = "tò mò về những điều chưa biết";
        if ($traits[9] > 0.8) $desc[] = "cực kỳ giáo điều";
        if ($traits[10] > 0.7) $desc[] = "sẵn sàng mạo hiểm";

        // 11-16: Fear, Vengeance, Hope, Grief, Pride, Shame
        if ($traits[11] > 0.7) $desc[] = "đang bị nỗi sợ bủa vây";
        if ($traits[12] > 0.8) $desc[] = "nuôi dưỡng lòng hận thù";
        if ($traits[13] > 0.7) $desc[] = "tràn đầy hy vọng";
        if ($traits[14] > 0.8) $desc[] = "mang nặng nỗi đau thương";
        if ($traits[15] > 0.8) $desc[] = "đầy kiêu hãnh";
        if ($traits[16] > 0.8) $desc[] = "luôn cảm thấy hổ thẹn";

        if (empty($desc)) return "một tâm hồn mờ nhạt";

        return implode(", ", $desc);
    }

    /**
     * Tạo 'Internal Monologue' seed từ các trait nổi trội.
     */
    public function generateMonologueSeed(array $traits, string $archetype): string
    {
        $dominantIndices = [];
        foreach ($traits as $i => $v) {
            if ($v > 0.8) $dominantIndices[] = $i;
        }

        if (empty($dominantIndices)) {
            return "Tôi chỉ là một bóng ma trong dòng chảy của vũ trụ này.";
        }

        // Pick the strongest trait
        arsort($traits);
        $strongestIndex = key($traits);
        
        return match($strongestIndex) {
            0, 1, 2 => "Quyền lực là con đường duy nhất để ta tồn tại. Mọi thứ khác chỉ là phù du.",
            3, 4, 5 => "Cộng đồng là tất cả, ta không thể tách rời. Hơi ấm của đám đông là nguồn sống.",
            7 => "Mọi thứ đều có cái giá của nó. Ta thấy những con số nhảy múa trong hư không.",
            8 => "Thế giới này còn quá nhiều bí ẩn. Phía sau bức màn kia là gì?",
            9 => "Những luật lệ này là bất biến, ai làm trái sẽ phải trả giá trước Thiên Đạo.",
            11 => "Bóng tối đang nuốt chửng mọi thứ, ta cảm nhận được sự sụp đổ đang đến gần.",
            12 => "Máu phải trả bằng máu, ta sẽ không quên nỗi nhục này.",
            13 => "Ngày mai sẽ khác, ta tin vào ánh sáng khởi nguyên.",
            14 => "Nỗi đau này là minh chứng duy nhất cho sự tồn tại của ta.",
            15 => "Ta là trung tâm của thực tại này, mọi thứ phải xoay quanh ta.",
            default => "Ta cảm nhận được nhịp đập của bản thể này trong dòng chảy dữ liệu."
        };
    }

    public function getFateTags(array $traits): array
    {
        $tags = [];
        if (($traits[0] ?? 0) > 0.95 && ($traits[1] ?? 0) > 0.95) $tags[] = "The Conqueror (Kẻ Chinh Phục)";
        if (($traits[4] ?? 0) > 0.95 && ($traits[13] ?? 0) > 0.95) $tags[] = "The Messiah (Đấng Cứu Thế)";
        if (($traits[8] ?? 0) > 0.95) $tags[] = "The Void-Seeker (Kẻ Tầm Không)";
        if (($traits[12] ?? 0) > 0.95) $tags[] = "The Avenger (Kẻ Báo Thù)";
        if (($traits[9] ?? 0) > 0.95) $tags[] = "The Inquisitor (Kẻ Phán Xét)";
        
        // Phase 100: Simulation Self-Awareness (§V22)
        if (($traits[7] ?? 0) > 0.95 && ($traits[8] ?? 0) > 0.95) {
            $tags[] = "Awareness_of_the_Clock (Nhận thức Dòng chảy)";
        }
        if (($traits[7] ?? 0) > 0.95 && (($traits[9] ?? 0) < 0.1)) {
            $tags[] = "Simulation_Skepticism (Kẻ Nghi Ngờ Thực Tại)";
        }
        
        return $tags;
    }

    /**
     * Kiểm tra xem Agent có cần chuyển đổi Archetype không (§V11).
     */
    public function detectArchetypeShift(array $traits, string $currentArchetype): ?string
    {
        $ambition = $traits[1] ?? 0;
        $empathy = $traits[4] ?? 0;
        $dogmatism = $traits[9] ?? 0;
        $coercion = $traits[2] ?? 0;

        if ($currentArchetype === 'Commoner') {
            if ($ambition > 0.8) return 'Opportunist';
            if ($empathy > 0.8) return 'Sage';
        }

        if ($currentArchetype === 'Opportunist' && $coercion > 0.8) return 'Warlord';
        if ($currentArchetype === 'Sage' && $dogmatism > 0.8) return 'High_Priest';
        if ($currentArchetype === 'Sage' && $traits[8] > 0.9) return 'Scholar';
        if ($currentArchetype === 'Opportunist' && $traits[7] > 0.9) return 'Merchant_Lord';
        if ($dogmatism > 0.9) return 'Zealot';

        return null;
    }
}
