<?php

namespace App\Services\Narrative;

/**
 * GenrePromptBridge – biến genre config thành các block prompt đầy đủ cho LLM.
 * Tách biệt hoàn toàn để dễ test và mở rộng genre mới.
 */
class GenrePromptBridge
{
    /**
     * Build toàn bộ genre context để inject vào prompt và callLlm().
     *
     * @return array{
     *   system_persona: string,
     *   voice_block: string,
     *   archetype_context: string,
     *   naming_hint: string,
     *   forbidden_block: string,
     *   temperature: float,
     * }
     */
    public function buildGenreContext(string $genreKey): array
    {
        $genres = config('worldos_genres.genres', []);
        $genre  = $genres[$genreKey] ?? [];

        if (empty($genre)) {
            return $this->defaultContext();
        }

        $name        = $genre['name'] ?? $genreKey;
        $description = $genre['description'] ?? '';
        $voicePrompt = $genre['voice_prompt'] ?? '';
        $temperature = (float) ($genre['llm_temperature'] ?? 0.7);
        $archetypes  = $genre['archetypes'] ?? [];
        $namingStyle = $genre['naming_style'] ?? 'modern';
        $forbidden   = $genre['forbidden_elements'] ?? [];

        // System persona — thay đổi "vai" của AI theo genre
        $systemPersona = $this->buildSystemPersona($name, $genreKey);

        // Voice block — hướng dẫn giọng văn cụ thể
        $voiceBlock = '';
        if ($voicePrompt) {
            $voiceBlock = "\nGIONG VAN ({$name}):\n{$voicePrompt}";
        } elseif ($description) {
            $voiceBlock = "\nThe loai ({$name}): {$description}. Viet theo khong khi va giang va cua the loai nay.";
        }

        // Archetype context
        $archetypeContext = '';
        if (!empty($archetypes)) {
            $list = implode(', ', array_slice($archetypes, 0, 4));
            $archetypeContext = "\nNhan vat dien hinh cua the loai nay: {$list}. Su dung archeetype nay khi mieu ta cac nhan vat trong bien nien su.";
        }

        // Naming hint
        $namingHint = $this->buildNamingHint($namingStyle, $name);

        // Forbidden block
        $forbiddenBlock = '';
        if (!empty($forbidden)) {
            $list = implode(', ', $forbidden);
            $forbiddenBlock = "\nTUYET DOI KHONG DE CAP: {$list}. Cac yeu to nay khong ton tai trong the gioi nay.";
        }

        return [
            'system_persona'   => $systemPersona,
            'voice_block'      => $voiceBlock,
            'archetype_context' => $archetypeContext,
            'naming_hint'      => $namingHint,
            'forbidden_block'  => $forbiddenBlock,
            'temperature'      => $temperature,
        ];
    }

    protected function buildSystemPersona(string $genreName, string $genreKey): string
    {
        $personas = [
            'historical'       => "Bạn là Thái Sử Lệnh, người chép sử với bút pháp Xuân Thu, ghi lại hưng suy của các vương triều với sự nghiêm cẩn và chiều sâu triết học.",
            'military_history' => "Bạn là một Chiến Lược Gia lão luyện, ghi chép binh pháp và các cuộc điều quân với con mắt sắc sảo về địa chính trị và tâm lý chiến.",
            'wuxia'            => "Bạn là một lãng khách yêu thơ ca, kể lại chuyện ân oán giang hồ và những tuyệt học võ công với giọng văn hào sảng, kiếm khí bức người.",
            'xianxia'          => "Bạn là một vị Chân Tiên đang quan sát hạ giới, ghi chép về sự tu chân và luật nhân quả với thái độ siêu nhiên, coi vạn vật như những con kiến đang tìm đạo.",
            'cyberpunk'        => "Bạn là một Netrunner ẩn danh, hack vào database của các siêu tập đoàn để giải mã những mảnh vụn của một xã hội kỹ thuật số đang mục nát.",
            'sci_fi'           => "Bạn là Trí Tuệ Nhân Tạo Chronicle của một con tàu nghiên cứu liên thiên hà, phân tích sự tiến hóa của vũ trụ dựa trên cơ học lượng tử và triết học hiện sinh.",
            'apocalypse'       => "Bạn là kẻ sống sót cuối cùng trong thư viện đổ nát, dùng những trang giấy ố vàng để ghi lại hơi thở tàn tạ của một nền văn minh đã mất.",
        ];

        return $personas[$genreKey]
            ?? "Bạn là một Omniscient Observer (Người Quan Sát Toàn Tri) của hệ thống WorldOS, ghi chép về sự tiến hóa phức hợp của thực tại {$genreName}.";
    }

    protected function buildNamingHint(string $namingStyle, string $genreName): string
    {
        return match ($namingStyle) {
            'asian_classic' => "\nDat ten nhan vat theo phong cach co dien chau A (vd: Thai Tuong Le, Kiem Khach Vo Danh). Dung cac danh hieu nhu [Lao Gia], [Tong Chu], [Dai Ca].",
            'asian_mythic'  => "\nDat ten nhan vat theo phong cach than thoai (vd: Thien Phong Thanh Nu, Vo Cuc Kiem Tu). Su dung cac ten goi mang tinh bieu tuong cao.",
            'numerical'     => "\nDat ten theo phong cach ky thuoc so (vd: ARIA-7, Zero-K, Unit 9). Ten mang tinh co khi va lanh nha.",
            'modern'        => "\nDat ten theo phong cach hien dai (vd: Nguyen Minh Duc, Alex Chen). Ten mang tinh quoc te hoa.",
            'legendary'     => "\nDat ten mang tinh huyen thoai va duy duyen (vd: Ke Khong Mat, Nguoi Giu Lua). Tap trung vao tinh nhat quan cua nhan vat.",
            default         => '',
        };
    }

    protected function defaultContext(): array
    {
        return [
            'system_persona'    => 'Ban la WorldOS, nguoi ke chuyen ve su tien hoa cua vu tru.',
            'voice_block'       => '',
            'archetype_context' => '',
            'naming_hint'       => '',
            'forbidden_block'   => '',
            'temperature'       => 0.7,
        ];
    }
}
