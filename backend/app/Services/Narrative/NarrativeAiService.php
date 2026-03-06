<?php

namespace App\Services\Narrative;

use App\Contracts\LlmNarrativeClientInterface;
use App\Models\Chronicle;
use App\Models\Universe;
use App\Models\AgentConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Narrative AI: build prompt from Perceived Archive + events + flavor + residual, call LLM, store Chronicle.
 * Does NOT read canonical archive or modify simulation state.
 */
class NarrativeAiService
{
    protected $config;

    public function __construct(
        protected PerceivedArchiveBuilder $perceived,
        protected FlavorTextMapper $flavor,
        protected EventTriggerMapper $eventMapper,
        protected ResidualInjector $residual,
        protected \App\Services\AI\VectorSearchService $vectorSearch,
        protected \App\Services\AI\MemoryService $memory,
        protected \App\Services\Simulation\MythicResonanceEngine $resonance,
        protected ?LlmNarrativeClientInterface $llmClient = null
    ) {
        $this->config = AgentConfig::first();
        if ($this->llmClient === null && app()->bound(LlmNarrativeClientInterface::class)) {
            $this->llmClient = app(LlmNarrativeClientInterface::class);
        }
    }

    /**
     * Generate chronicle for universe in tick range. Uses env NARRATIVE_LLM_URL or stub.
     */
    public function generateChronicle(int $universeId, int $fromTick, ?int $toTick = null, string $type = 'chronicle'): ?Chronicle
    {
        $universe = Universe::with('world')->find($universeId);
        if (! $universe) {
            return null;
        }

        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        $vector = $latest?->state_vector ?? [];
        $metrics = $latest?->metrics ?? [];
        
        // Merge V6 metrics into vector for PerceivedArchiveBuilder
        if (is_array($vector) && is_array($metrics)) {
            $vector = array_merge($vector, $metrics);
        }

        // V6: Keep zone structure, do NOT flatten if zones exist
        // Flattening was for V5 legacy, V6 needs zone context for agents
        if (is_array($vector) && !isset($vector['zones']) && isset($vector[0]['state'])) {
            $flat = [];
            foreach ($vector as $z) {
                $flat = array_merge($flat, $z['state'] ?? []);
            }
            $vector = $flat;
        }

        // Tier 1 & 2: detect event types from threshold_rules (entropy, stability_index, etc.) then map to names
        $detected = $this->eventMapper->detectTriggeredEvents((array) $vector);
        $eventTypes = !empty($detected)
            ? $detected
            : ['crisis', 'unrest', 'formation', 'collapse', 'myth_scar', 'secession', 'micro_mode', 'meta_cycle'];
        $perceived = $this->perceived->build($universeId, $eventTypes, (array)$vector, $toTick);

        // Genre from World for narrative tone (MVP: at least 3 genres produce different voice)
        $world = $universe->world;
        $genreKey = $world ? ($world->current_genre ?? $world->base_genre ?? 'wuxia') : 'wuxia';
        $genreConfig = config('worldos_genres.genres.' . $genreKey, []);
        $genreName = $genreConfig['name'] ?? $genreKey;
        $genreDescription = $genreConfig['description'] ?? '';
        $perceived['narrative_genre'] = [
            'key' => $genreKey,
            'name' => $genreName,
            'description' => $genreDescription,
        ];

        // Tier 3: Residual Injection is already in PerceivedArchiveBuilder's output
        
        // Contextual search for long-term memory
        $contextQuery = implode(' ', [
            implode(' ', $perceived['events'] ?? []),
            implode(' ', $perceived['materials'] ?? []),
            json_encode($perceived['culture'] ?? []),
            implode(' ', $perceived['institutions'] ?? []),
        ]);
        
        $facts = [];
        try {
            $facts = $this->memory->search($contextQuery, $universeId, 5);
        } catch (\Throwable $e) {
            Log::warning("Memory search failed: " . $e->getMessage());
        }

        $prompt = $this->buildPrompt($perceived, $fromTick, $toTick ?? $fromTick, $facts);
        $content = $this->callLlm($prompt);

        if ($content === null) {
            $content = $this->generateMockNarrative($prompt);
        }

        // Store with embedding for search
        $vector = [0]; // default empty vector
        try {
            $vector = $this->vectorSearch->vectorize($content);
        } catch (\Throwable $e) {
            Log::warning("Vectorization failed: " . $e->getMessage());
        }
        $vectorString = '[' . implode(',', $vector) . ']';

        $chronicle = Chronicle::create([
            'universe_id' => $universeId,
            'from_tick' => $fromTick,
            'to_tick' => $toTick,
            'type' => $type,
            'content' => $content,
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => $content
            ],
            'perceived_archive_snapshot' => $perceived,
            'embedding' => \Illuminate\Support\Facades\DB::raw("'$vectorString'::vector"),
        ]);

        // Phase 66: Mythic Resonance (§V11)
        try {
            $this->resonance->process($chronicle);
        } catch (\Throwable $e) {
            Log::warning("Mythic Resonance processing failed: " . $e->getMessage());
        }

        return $chronicle;
    }

    /**
     * Generate a short narrative snippet bypassing full contextual archive (§V27).
     * Used by EventNarrativeService for specific, isolated events.
     */
    public function generateSnippet(string $prompt): ?string
    {
        return $this->callLlm($prompt);
    }


    protected function buildPrompt(array $perceived, int $fromTick, ?int $toTick, array $facts): string
    {
        $flavor = implode(' ', $perceived['flavor'] ?? []);
        $events = implode(', ', array_values($perceived['events'] ?? []));
        $materials = implode(', ', $perceived['materials'] ?? []);
        $institutions = implode(', ', $perceived['institutions'] ?? []);
        $culture = json_encode($perceived['culture'] ?? []);
        $branches = implode('; ', $perceived['branch_events'] ?? []);
        $entropy = $perceived['metrics']['entropy'] ?? 'unknown';
        $instability = $perceived['metrics']['instability'] ?? 0;
        $sci = $perceived['metrics']['sci'] ?? 1.0;
        $tail = $perceived['residual_prompt_tail'] ?? '';
        
        $reflections = '';
        if (!empty($perceived['agent_reflections'])) {
            $reflections = "\nGIỌNG NÓI TỪ CHIỀU VI MÔ (Internal Monologues):\n";
            foreach ($perceived['agent_reflections'] as $ref) {
                $reflections .= "- [{$ref['name']} - {$ref['archetype']}]: {$ref['thinking']} (Người này {$ref['description']})\n";
            }
        }
        
        $factsText = '';
        if (!empty($facts)) {
            $factsText = "\nKIẾN THỨC CỔ XƯA (Bản lưu Ký ức):\n- " . implode("\n- ", array_slice($facts, 0, 5));
        }

        $personality = $this->config->personality ?? 'Sử gia vũ trụ';
        $agentName = $this->config->agent_name ?? 'Biên niên sử WorldOS';
        $themes = implode(', ', $this->config->themes ?? ['Tổng quát']);
        $creativity = $this->config->creativity ?? 50;

        $genreBlock = '';
        if (!empty($perceived['narrative_genre'])) {
            $g = $perceived['narrative_genre'];
            $genreBlock = "\nThể loại (Genre): {$g['name']}. " . ($g['description'] ? "{$g['description']}. " : '') . "Viết biên niên theo phong cách và không khí của thể loại này.";
        }

        $epicIntro = "";
        $legendaryFocus = "";
        if (!empty($perceived['agent_reflections'])) {
            foreach ($perceived['agent_reflections'] as $ref) {
                 if (!empty($ref['fate_tags'])) {
                     $tags = implode(', ', $ref['fate_tags']);
                     $legendaryFocus .= "\nHuyền thoại đang trỗi dậy: {$ref['name']} mang dấu ấn [{$tags}].\n";
                     $epicIntro = "ĐÂY LÀ MỘT CHƯƠNG SỬ THI (EPIC CHRONICLE). ";
                 }
            }
        }

        return <<<EOT
Bạn là $agentName, một $personality của vũ trụ mô phỏng.
$epicIntro Chủ đề trọng tâm: $themes. Mức độ sáng tạo: $creativity%.$genreBlock

$legendaryFocus
TRẠNG THÁI BẢN THỂ (Ontological State):
- Cấp độ: {$perceived['existence']['tier']} ({$perceived['existence']['name']})
- Mô tả: {$perceived['existence']['description']}
- Hiệu ứng thực tại: {$perceived['existence']['effect']}
- Độ ổn định thực tại (Reality Stability): {$perceived['metrics']['reality_stability']}
Ngôn ngữ phản hồi: TIẾNG VIỆT (Tông giọng trang trọng, huyền bí hoặc khoa học viễn tưởng).

Thời kỳ: Tick $fromTick đến $toTick.
Trạng thái Thế giới (Cảm quan - Perceived):
- Entropy (Độ hỗn loạn): $entropy
- Bất ổn tri thức (Fog of War): $instability
- Vật liệu chủ đạo: $materials
- Văn hóa cộng đồng (Vector): $culture
- Định chế đang hoạt động: $institutions
- Sự kiện ghi nhận: $events
- Biến động dòng thời gian: $branches
- Không khí (Flavor): $flavor
$reflections
$factsText

NHIỆM VỤ: Hãy viết một đoạn biên niên sử ngắn gọn. 
Nếu có 'GIỌNG NÓI TỪ CHIỀU VI MÔ', hãy lồng ghép các suy nghĩ của họ vào lời dẫn chuyện để làm nổi bật sự phản tư của thế giới. 
Tập trung vào tính nhân quả: sự thay đổi vật chất và văn hóa đã dẫn dắt sự trỗi dậy hoặc sụp đổ của các định chế như thế nào. 
Nếu chỉ số 'Bất ổn tri thức' cao (>$instability), hãy dùng ngôn từ mờ ảo, thần thoại hóa các sự kiện.
$tail
EOT;
    }

    protected function callLlm(string $prompt): ?string
    {
        if ($this->llmClient?->isAvailable()) {
            return $this->llmClient->generate($prompt);
        }

        if ($this->config && $this->config->model_type === 'local') {
            return $this->callLocalAI($prompt);
        }

        $apiKey = $this->config->api_key ?? config('services.openai.key');
        
        if ($apiKey) {
            try {
                $model = $this->config->model_name ?? config('services.openai.model', 'gpt-4o');
                
                $response = Http::withToken($apiKey)
                    ->timeout(30)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => $model,
                        'messages' => [
                            ['role' => 'system', 'content' => "Bạn là WorldOS, người kể chuyện về sự tiến hóa của vũ trụ."],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.7,
                    ]);

                if ($response->successful()) {
                    return $response->json('choices.0.message.content');
                }
            } catch (\Throwable $e) {
                Log::error("OpenAI Error: " . $e->getMessage());
            }
        }

        return null;
    }

    protected function callLocalAI(string $prompt): ?string
    {
        $endpoint = $this->config->local_endpoint ?? 'http://host.docker.internal:11434/v1/chat/completions';
        $model = $this->config->model_name ?? 'mistral';

        if (str_contains($endpoint, 'localhost')) {
            $endpoint = str_replace('localhost', 'host.docker.internal', $endpoint);
        }

        try {
            $response = Http::timeout(30)->post($endpoint, [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => "Bạn là người ghi chép sáng tạo cho một trò chơi mô phỏng."],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                return trim(str_replace(['"', "'"], '', $content));
            }
        } catch (\Throwable $e) {
            Log::error("Local AI Error: " . $e->getMessage());
        }

        return null;
    }

    protected function generateMockNarrative(string $prompt): string
    {
        // Extract key info for mock generation
        preg_match('/Entropy ([\w\W]+): ([\d.]+)/', $prompt, $mEntropy);
        preg_match('/Vật liệu chủ đạo: (.*)/', $prompt, $mMat);
        
        $entropy = floatval($mEntropy[2] ?? 0);
        $materials = $mMat[1] ?? 'hư không';
        
        if ($entropy > 0.8) {
            return "Hỗn loạn ngự trị. Cấu trúc của $materials sụp đổ dưới sức nặng của sự gia tăng entropy ($entropy). Xã hội tan rã thành những mảnh vỡ sinh tồn biệt lập.";
        } elseif ($entropy > 0.5) {
            return "Căng thẳng leo thang. Thời đại của $materials đối mặt với sự trì trệ khi entropy chạm ngưỡng $entropy. Những lời thì thầm về sự thay đổi vang vọng khắp hệ thống.";
        } else {
            return "Một thời kỳ hoàng kim. $materials hưng thịnh trong một trật tự ổn định (Entropy: $entropy). Nền văn minh mở rộng sự phức hợp với niềm tin vững chãi.";
        }
    }
}
