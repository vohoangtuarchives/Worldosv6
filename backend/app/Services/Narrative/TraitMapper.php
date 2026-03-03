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
        if ($traits[15] > 0.8) $desc[] = "đầy kiêu hãnh";

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
            0, 1, 2 => "Quyền lực là con đường duy nhất để ta tồn tại.",
            3, 4, 5 => "Cộng đồng là tất cả, ta không thể tách rời.",
            8 => "Thế giới này còn quá nhiều bí ẩn cần được khai phá.",
            9 => "Những luật lệ này là bất biến, ai làm trái sẽ phải trả giá.",
            11 => "Bóng tối đang nuốt chửng mọi thứ, ta phải trốn chạy.",
            12 => "Máu phải trả bằng máu, ta sẽ không quên.",
            13 => "Ngày mai sẽ khác, ta tin vào ánh sáng.",
            default => "Ta cảm nhận được nhịp đập của simulacrum này."
        };
    }
}
