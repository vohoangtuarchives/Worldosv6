<?php

namespace App\Services\IpFactory;

use App\Models\NarrativeSeries;
use App\Models\SerialChapter;
use App\Models\StoryBible;
use App\Models\MythScar;
use App\Services\Narrative\NarrativeAiService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SerialStoryService
{
    public function __construct(
        protected NarrativeAiService $narrativeAi,
        protected StoryBibleService $storyBibleService
    ) {}

    /**
     * Tạo một NarrativeSeries mới gắn với Universe.
     */
    public function createSeries(array $data): NarrativeSeries
    {
        $series = NarrativeSeries::create([
            'universe_id' => $data['universe_id'],
            'saga_id'     => $data['saga_id'] ?? null,
            'title'       => $data['title'],
            'genre_key'   => $data['genre_key'] ?? 'wuxia',
            'status'      => 'active',
            'config'      => $data['config'] ?? [],
        ]);

        // Tạo StoryBible rỗng
        StoryBible::create(['series_id' => $series->id]);

        Log::info("IP Factory: Tạo Series #{$series->id} - '{$series->title}'");

        return $series->load(['universe', 'bible']);
    }

    /**
     * Sinh chapter tiếp theo cho series dựa trên trạng thái Universe hiện tại.
     */
    public function generateNextChapter(NarrativeSeries $series): SerialChapter
    {
        $universe = $series->universe;
        if (!$universe) {
            throw new \RuntimeException("Series #{$series->id} không có Universe.");
        }

        // Xác định tick range để sinh Chapter
        $latestSnapshot = $universe->snapshots()->orderByDesc('tick')->first();
        $toTick = $latestSnapshot?->tick ?? 0;

        // Tìm chapter cuối cùng để biết từ tick nào
        $lastChapter = $series->chapters()->orderByDesc('chapter_index')->first();
        $fromTick = $lastChapter ? ($lastChapter->tick_end ?? 0) + 1 : 0;
        $chapterIndex = $lastChapter ? $lastChapter->chapter_index + 1 : 1;

        if ($toTick < $fromTick) {
            throw new \RuntimeException("Không đủ ticks mới để sinh chapter. Hãy advance simulation thêm.");
        }

        // Gọi NarrativeLoom (LangGraph) để sinh chương truyện chất lượng cao
        $loomUrl = config('services.loom.url', 'http://narrative_loom:8001');
        
        Log::info("IP Factory: Triggering NarrativeLoom for Series #{$series->id} (Ticks: {$fromTick}-{$toTick})");

        try {
            $response = Http::timeout(600)->post($loomUrl . '/weave-chronicles', [
                'world_id'   => $universe->world_id,
                'tick_start' => $fromTick,
                'tick_end'   => $toTick,
            ]);

            if ($response->failed()) {
                 throw new \RuntimeException("NarrativeLoom failed: " . $response->body());
            }

            $result = $response->json();
            $content = $result['final_prose'] ?? 'Không thể tổng hợp nội dung chương truyện.';
            
            // Tạo Chronicle để mapping
            $chronicle = \App\Models\Chronicle::create([
                'universe_id' => $universe->id,
                'from_tick'   => $fromTick,
                'to_tick'     => $toTick,
                'content'     => $content,
                'raw_payload' => json_encode(['source' => 'narrative_loom', 'loom_result' => $result]),
            ]);

        } catch (\Exception $e) {
            Log::error("IP Factory: NarrativeLoom Error: " . $e->getMessage());
            // Fallback to simple generation if Loom fails
            $chronicle = $this->narrativeAi->generateChronicle(
                $universe->id,
                $fromTick,
                $toTick,
                'serial_chapter'
            );
            $content = $chronicle?->content ?? 'Không có nội dung.';
        }

        $chapterTitle = $this->generateChapterTitle($series, $chapterIndex, $content);

        $chapter = \App\Models\SerialChapter::create([
            'series_id'     => $series->id,
            'chronicle_id'  => $chronicle?->id,
            'book_index'    => $series->current_book_index,
            'chapter_index' => $chapterIndex,
            'title'         => $chapterTitle,
            'content'       => $content,
            'tick_start'    => $fromTick,
            'tick_end'      => $toTick,
            'needs_review'  => true,
        ]);

        // Tăng bộ đếm series
        $series->increment('total_chapters_generated');

        Log::info("IP Factory: Chapter #{$chapterIndex} sinh xong cho Series #{$series->id}");

        return $chapter;
    }

    /**
     * Canonize a chapter: đánh dấu là official, cập nhật StoryBible, tạo MythScar.
     */
    public function canonizeChapter(SerialChapter $chapter): SerialChapter
    {
        if ($chapter->isCanonized()) {
            throw new \RuntimeException("Chapter #{$chapter->id} đã được canonize.");
        }

        $chapter->update([
            'canonized_at' => now(),
            'needs_review' => false,
        ]);

        $series = $chapter->series;

        // Cập nhật StoryBible từ nội dung chapter
        try {
            $bible = $series->bible ?? StoryBible::create(['series_id' => $series->id]);
            $this->storyBibleService->updateFromChapter($chapter, $series);
        } catch (\Throwable $e) {
            Log::warning("IP Factory: StoryBible update failed for Chapter #{$chapter->id}: " . $e->getMessage());
        }

        // Tạo MythScar để đưa chapter vào memory của vũ trụ
        try {
            $latestSnapshot = $series->universe->snapshots()->orderByDesc('tick')->first();
            $zones = ($latestSnapshot?->state_vector ?? [])['zones'] ?? [];
            $zoneId = is_array($zones) && isset($zones[0]['id']) ? (string) $zones[0]['id'] : 'root';
            MythScar::create([
                'universe_id'     => $series->universe_id,
                'zone_id'         => $zoneId,
                'name'            => "Canon: {$chapter->title}",
                'description'     => "Chapter Canonized - Book {$chapter->book_index}, Ch {$chapter->chapter_index}. Ticks: {$chapter->tick_start}-{$chapter->tick_end}",
                'severity'        => 0.3,
                'decay_rate'      => 0.01,
                'created_at_tick' => $latestSnapshot?->tick ?? $chapter->tick_end ?? 0,
            ]);
        } catch (\Throwable $e) {
            Log::warning("IP Factory: MythScar không tạo được: " . $e->getMessage());
        }

        Log::info("IP Factory: Chapter #{$chapter->id} đã Canonized.");

        return $chapter->fresh();
    }

    protected function generateChapterTitle(NarrativeSeries $series, int $index, string $content): string
    {
        // Lấy 10 từ đầu của content để làm gợi ý tên chapter
        $words = array_slice(explode(' ', strip_tags($content)), 0, 8);
        $snippet = implode(' ', $words);
        return "Chương {$index}: " . rtrim($snippet, '.,;:') . '...';
    }
}
