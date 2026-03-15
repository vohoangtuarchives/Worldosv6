<?php

namespace App\Services\Narrative;

class TraitMapper
{
    public function mapToDescription(array $traits): string
    {
        $desc = [];

        // CLUSTER I: Power & Dominance
        if (TraitType::get($traits, TraitType::DOMINANCE) > 0.7) $desc[] = "khát khao thống trị";
        if (TraitType::get($traits, TraitType::AMBITION)  > 0.7) $desc[] = "tham vọng lớn lao";
        if (TraitType::get($traits, TraitType::COERCION)  > 0.7) $desc[] = "thích dùng quyền lực";

        // CLUSTER II: Social Bonds
        if (TraitType::get($traits, TraitType::EMPATHY)   > 0.8) $desc[] = "giàu lòng trắc ẩn";
        if (TraitType::get($traits, TraitType::SOLIDARITY) > 0.8) $desc[] = "luôn hướng về cộng đồng";
        if (TraitType::get($traits, TraitType::CONFORMITY) > 0.8) $desc[] = "dễ bị khuất phục bởi đám đông";

        // CLUSTER III: Cognition
        if (TraitType::get($traits, TraitType::PRAGMATISM)     > 0.7) $desc[] = "thực dụng và tỉnh táo";
        if (TraitType::get($traits, TraitType::CURIOSITY)      > 0.7) $desc[] = "tò mò về những điều chưa biết";
        if (TraitType::get($traits, TraitType::DOGMATISM)      > 0.8) $desc[] = "cực kỳ giáo điều";
        if (TraitType::get($traits, TraitType::RISK_TOLERANCE) > 0.7) $desc[] = "sẵn sàng mạo hiểm";

        // CLUSTER IV: Emotions
        if (TraitType::get($traits, TraitType::FEAR)      > 0.7) $desc[] = "đang bị nỗi sợ bủa vây";
        if (TraitType::get($traits, TraitType::VENGEANCE) > 0.8) $desc[] = "nuôi dưỡng lòng hận thù";
        if (TraitType::get($traits, TraitType::HOPE)      > 0.7) $desc[] = "tràn đầy hy vọng";
        if (TraitType::get($traits, TraitType::GRIEF)     > 0.8) $desc[] = "mang nặng nỗi đau thương";
        if (TraitType::get($traits, TraitType::PRIDE)     > 0.8) $desc[] = "đầy kiêu hãnh";
        if (TraitType::get($traits, TraitType::SHAME)     > 0.8) $desc[] = "luôn cảm thấy hổ thẹn";

        if (empty($desc)) return "một tâm hồn mờ nhạt";

        return implode(", ", $desc);
    }

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
        $strongestIndex = (int) key($traits);
        
        return match($strongestIndex) {
            TraitType::DOMINANCE, 
            TraitType::AMBITION, 
            TraitType::COERCION => "Quyền lực là con đường duy nhất để ta tồn tại. Mọi thứ khác chỉ là phù du.",

            TraitType::LOYALTY, 
            TraitType::EMPATHY, 
            TraitType::SOLIDARITY => "Cộng đồng là tất cả, ta không thể tách rời. Hơi ấm của đám đông là nguồn sống.",

            TraitType::PRAGMATISM    => "Mọi thứ đều có cái giá của nó. Ta thấy những con số nhảy múa trong hư không.",
            TraitType::CURIOSITY     => "Thế giới này còn quá nhiều bí ẩn. Phía sau bức màn kia là gì?",
            TraitType::DOGMATISM     => "Những luật lệ này là bất biến, ai làm trái sẽ phải trả giá trước Thiên Đạo.",
            TraitType::FEAR          => "Bóng tối đang nuốt chửng mọi thứ, ta cảm nhận được sự sụp đổ đang đến gần.",
            TraitType::VENGEANCE     => "Máu phải trả bằng máu, ta sẽ không quên nỗi nhục này.",
            TraitType::HOPE          => "Ngày mai sẽ khác, ta tin vào ánh sáng khởi nguyên.",
            TraitType::GRIEF         => "Nỗi đau này là minh chứng duy nhất cho sự tồn tại của ta.",
            TraitType::PRIDE         => "Ta là trung tâm của thực tại này, mọi thứ phải xoay quanh ta.",
            
            default => "Ta cảm nhận được nhịp đập của bản thể này trong dòng chảy dữ liệu."
        };
    }


}
