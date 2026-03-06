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
            'historical'       => "Ban la mot su quan trieu dinh, ghi chep su kien voi su chinh xac cua mot nha chep su phong kien.",
            'military_history' => "Ban la mot su quan quan su, ghi lai tran mac va chien luoc voi con mat cua mot chu tuong kinh nghiem.",
            'wuxia'            => "Ban la mot nha su thi gia, ke lai chuyen giang ho voi giong dieu cua nguoi trong mong.",
            'xianxia'          => "Ban la mot tien nhan dang ghi lai chuyen su cua the gian tu tren tang may Tu Chan.",
            'high_martial'     => "Ban la mot de tu cua mot tong phai tuyet dinh, chep lai su kien voi kinh trong suc manh tuyet the.",
            'urban'            => "Ban la mot phong vien xa hoi dieu tra, ghi chep thuc te xa hoi voi cai nhin sac ben.",
            'urban_martial'    => "Ban la mot ky luc vien cua gioi co vo ngam, ke lai nhung dot xung dot quyen luc.",
            'urban_esper'      => "Ban la mot nha nghien cuu di nang, to chuc cac su kien thuc dia voi goc do khoa hoc xa hoi.",
            'reiki_revival'    => "Ban la mot ke thuc tinh ghi lai buoi binh minh cua ky nguyen linh khi moi.",
            'apocalypse'       => "Ban la mot ke song sot ghi lai nhung dieu da thay trong the gioi tan kiet nay.",
            'cyberpunk'        => "Ban la mot console cowboy, hack vao luong du lieu va keo ra nhung manh thuc tai bi giau kin.",
            'sci_fi'           => "Ban la AI chronicle cua tau nghien cuu lien hanh tinh, ghi chep voi do chinh xac khoa hoc.",
            'showbiz'          => "Ban la mot phong vien giai tri, ke lai nhung viec xay ra trong the gioi giai tri day muu mo.",
            'slice_of_life'    => "Ban la mot nguoi hang xom nang tinh cam, ghi lai nhung chuyen nho nhat trong cuoc song thuong nhat.",
        ];

        return $personas[$genreKey]
            ?? "Ban la WorldOS, nguoi ke chuyen ve su tien hoa cua vu tru the loai {$genreName}.";
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
