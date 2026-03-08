<?php

namespace App\Services\Narrative;

use App\Models\Universe;

class NarrativeStudioService
{
    public function __construct(
        protected NarrativeAiService $narrativeAi
    ) {
    }

    public function generateFromFacts(
        Universe $universe,
        array $facts,
        string $preset = 'chronicle',
        ?string $currentDraft = null,
        ?string $epicChronicle = null
    ): array {
        $preset = in_array($preset, ['chronicle', 'story', 'beats'], true) ? $preset : 'chronicle';
        $prompt = $this->buildPrompt($universe, $facts, $preset, $currentDraft, $epicChronicle);
        $content = $this->narrativeAi->generateSnippet($prompt);

        if (!$content) {
            $content = $this->buildFallback($universe, $facts, $preset, $currentDraft);
        }

        return [
            'content' => trim($content),
            'preset' => $preset,
            'fact_count' => count($facts),
            'universe_id' => $universe->id,
            'universe_name' => $universe->name,
            'used_ai' => !empty($content),
        ];
    }

    protected function buildPrompt(Universe $universe, array $facts, string $preset, ?string $currentDraft, ?string $epicChronicle = null): string
    {
        $world = $universe->world;
        $genre = $world?->current_genre ?? $world?->base_genre ?? 'worldos';
        $presetInstruction = match ($preset) {
            'story' => 'Viet lai thanh mot ban ke chuyen hoa, co canh mo dau, ap luc, xung dot va ket chuong ro rang. Giu chat lieu tu du lieu mo phong, nhung bien no thanh van xuoi giau hinh anh.',
            'beats' => 'Chuyen hoa thanh chapter beat sheet de bien tap: mo dau, bien co kich hoat, escalation, turning point, end beat. Moi beat ngan gon, ro action, ro goc bien tap.',
            default => 'Viet thanh mot ban chronicle bien tap, can bang giua tong ket lich su, ap luc he thong, va huong dien giai noi dung.',
        };

        $factLines = collect(array_slice($facts, 0, 8))
            ->map(function (array $fact, int $index) {
                $evidence = collect($fact['evidence'] ?? [])
                    ->map(fn (array $item) => ($item['label'] ?? 'signal') . ': ' . ($item['value'] ?? 'n/a'))
                    ->implode('; ');

                return ($index + 1) . '. [' . ($fact['kind'] ?? 'fact') . '] Tick ' . ($fact['tick'] ?? '?')
                    . ' | ' . ($fact['title'] ?? 'Untitled')
                    . ' | Summary: ' . ($fact['summary'] ?? '')
                    . ' | Angle: ' . ($fact['angle'] ?? '')
                    . ' | Evidence: ' . $evidence;
            })
            ->implode("\n");

        $draftBlock = $currentDraft
            ? "\nBAN NHAP HIEN TAI (co the rewrite, mo rong, hoac lam sac net hon):\n" . trim($currentDraft) . "\n"
            : '';

        $epicBlock = ($epicChronicle !== null && trim($epicChronicle) !== '')
            ? "\n\nSU THI TU SU GIA MU (Epic Chronicle - dung lam chat lieu chinh, bien tap thanh ban draft theo preset):\n" . trim($epicChronicle) . "\n"
            : '';

        return <<<PROMPT
Ban la bien tap vien noi dung cho WorldOS Narrative Studio.

MUC TIEU:
- Bien du lieu mo phong thanh noi dung bien tap su dung duoc.
- Khong duoc boc tach khoi simulation truth.
- Van ban dau ra phai giu duoc tinh nhan qua va ap luc he thong.

BOI CANH:
- Universe: {$universe->name}
- World genre: {$genre}
- Preset: {$preset}

YEU CAU CHINH:
{$presetInstruction}
- Viet bang tieng Viet tu nhien, ro, co chat van chuong nhung van de bien tap duoc.
- Khong noi ve "fact list", "simulation data", hay "prompt" trong dau ra.
- Neu thong tin chua day du, uu tien dien giai than trong thay vi che them tinh tiet cu the.
- Tra ve plain text duy nhat, khong markdown fence.
{$epicBlock}

NARRATIVE FACTS:
{$factLines}{$draftBlock}
PROMPT;
    }

    protected function buildFallback(Universe $universe, array $facts, string $preset, ?string $currentDraft): string
    {
        if ($currentDraft && trim($currentDraft) !== '') {
            return trim($currentDraft);
        }

        $header = match ($preset) {
            'story' => $universe->name . " Story Draft",
            'beats' => $universe->name . " Chapter Beats",
            default => $universe->name . " Chronicle",
        };

        $body = collect(array_slice($facts, 0, 5))
            ->map(function (array $fact, int $index) use ($preset) {
                if ($preset === 'beats') {
                    return ($index + 1) . '. Tick ' . ($fact['tick'] ?? '?') . ' - ' . ($fact['title'] ?? 'Fact') . ': ' . ($fact['summary'] ?? '');
                }

                return ($fact['summary'] ?? '') . ' ' . ($fact['angle'] ?? '');
            })
            ->filter()
            ->implode("\n\n");

        return trim($header . "\n\n" . ($body ?: 'Chua du du lieu de tao ban narrative moi.'));
    }
}
