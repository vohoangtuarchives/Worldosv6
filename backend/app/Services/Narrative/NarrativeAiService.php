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
        protected GenrePromptBridge $genreBridge,
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

        // Genre from World — full context via GenrePromptBridge
        $world = $universe->world;
        $genreKey = $world ? ($world->current_genre ?? $world->base_genre ?? 'wuxia') : 'wuxia';
        $genreContext = $this->genreBridge->buildGenreContext($genreKey);

        // Legacy: still set perceived['narrative_genre'] for backward compat
        $genreConfig = config('worldos_genres.genres.' . $genreKey, []);
        $perceived['narrative_genre'] = [
            'key'         => $genreKey,
            'name'        => $genreConfig['name'] ?? $genreKey,
            'description' => $genreConfig['description'] ?? '',
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

        $prompt = $this->buildPrompt($perceived, $fromTick, $toTick ?? $fromTick, $facts, $genreContext);
        $content = $this->callLlm($prompt, $genreContext);

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


    protected function buildPrompt(array $perceived, int $fromTick, ?int $toTick, array $facts, array $genreContext = []): string
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
        $fields = $perceived['metrics']['civ_fields'] ?? [];
        $fields = array_merge([
            'survival' => 0.0,
            'power' => 0.0,
            'wealth' => 0.0,
            'knowledge' => 0.0,
            'meaning' => 0.0,
        ], is_array($fields) ? $fields : []);
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

        // Genre context block — full voice guide (replaces old 1-line genreBlock)
        $genreBlock = '';
        if (!empty($genreContext)) {
            $genreBlock = $genreContext['voice_block'] ?? '';
            $genreBlock .= $genreContext['archetype_context'] ?? '';
            $genreBlock .= $genreContext['naming_hint'] ?? '';
            $genreBlock .= $genreContext['forbidden_block'] ?? '';
        } elseif (!empty($perceived['narrative_genre'])) {
            // Fallback khi không có genreContext
            $g = $perceived['narrative_genre'];
            $genreBlock = "\nThe loai ({$g['name']}): " . ($g['description'] ? "{$g['description']}. " : '') . "Viet bien nien theo phong cach va khong khi cua the loai nay.";
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

TRƯỜNG HẤP DẪN VĂN MINH (Civilization Attractor Fields):
- Sinh tồn (Survival): {$fields['survival']}
- Quyền lực (Power): {$fields['power']}
- Thịnh vượng (Wealth): {$fields['wealth']}
- Tri thức (Knowledge): {$fields['knowledge']}
- Ý nghĩa (Meaning): {$fields['meaning']}

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

        NHIỆM VỤ: Hãy viết một chương sử thi chi tiết và giàu hình ảnh (Epic Chronicle). 
        Đừng ngần ngại viết dài (3-5 đoạn văn), tập trung vào sự hùng tráng, bi kịch và tính nhân quả của lịch sử.
        Hãy miêu tả chi tiết: sự thay đổi vật chất và văn hóa đã dẫn dắt sự trỗi dậy hoặc sụp đổ của các định chế như thế nào. 
        Dựa vào 'TRƯỜNG HẤP DẪN VĂN MINH' để miêu tả khát vọng chủ đạo của thời đại này (ví dụ: nếu Quyền lực cao, hãy viết về những cuộc chinh phạt đẫm máu hoặc sự bành chướng uy quyền; nếu Ý nghĩa cao, hãy viết về những triết thuyết chấn động hoặc đức tin tận hiến).
        Nếu có 'GIỌNG NÓI TỪ CHIỀU VI MÔ', hãy lồng ghép các suy nghĩ của họ vào lời dẫn chuyện như những 'lời sấm truyền' hoặc 'tiếng vang của nội tâm' để làm nổi bật sự phản tư của thế giới. 
        Nếu chỉ số 'Bất ổn tri thức' cao (>$instability), hãy dùng ngôn từ huyền ảo, sương khói, biến những sự kiện thành thần thoại hóa.
        $tail
EOT;
    }

    protected function callLlm(string $prompt, array $genreContext = []): ?string
    {
        $temperature = $genreContext['temperature'] ?? 0.7;
        $systemPersona = $genreContext['system_persona']
            ?? 'Ban la WorldOS, nguoi ke chuyen ve su tien hoa cua vu tru.';

        if ($this->llmClient?->isAvailable()) {
            return $this->llmClient->generate($prompt);
        }

        if ($this->config && $this->config->model_type === 'local') {
            return $this->callLocalAI($prompt, $temperature);
        }

        $apiKey = $this->config->api_key ?? env('NARRATIVE_LLM_KEY') ?? config('services.openai.key');
        $endpoint = env('NARRATIVE_LLM_URL', 'https://api.openai.com/v1/chat/completions');

        if ($apiKey || str_contains($endpoint, 'localhost') || str_contains($endpoint, 'host.docker.internal')) {
            try {
                $model = $this->config->model_name ?? env('NARRATIVE_LLM_MODEL', 'gpt-4o');

                $request = Http::timeout(120);
                if ($apiKey) {
                    $request = $request->withToken($apiKey);
                }

                $response = $request->post($endpoint, [
                    'model'    => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPersona],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => $temperature,
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

    protected function callLocalAI(string $prompt, float $temperature = 0.7, string $systemPersona = ''): ?string
    {
        $endpoint = $this->config->local_endpoint ?? 'http://host.docker.internal:11434/v1/chat/completions';
        $model = $this->config->model_name ?? 'mistral';
        $persona = $systemPersona ?: 'Ban la nguoi ghi chep sang tao cho mot tro choi mo phong.';

        if (str_contains($endpoint, 'localhost')) {
            $endpoint = str_replace('localhost', 'host.docker.internal', $endpoint);
        }

        try {
            $response = Http::timeout(120)->post($endpoint, [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $persona],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => $temperature,
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
            return "Hỗn loạn ngự trị trong sự điên cuồng của hư không. Cấu trúc của $materials sụp đổ tan tành dưới sức nặng của sự gia tăng entropy ($entropy). Những định chế hùng mạnh một thời nay chỉ còn là đống tro tàn, xã hội tan rã thành những mảnh vỡ sinh tồn biệt lập trong bóng tối mịt mù. Đây là buổi hoàng hôn của một kỷ nguyên.";
        } elseif ($entropy > 0.5) {
            return "Căng thẳng leo thang đến mức nghẹt thở. Thời đại của $materials đối mặt với sự trì trệ và mục nát khi entropy chạm ngưỡng $entropy. Những lời thì thầm về cuộc đại biến vang vọng khắp các ngõ ngách của hệ thống, trong khi những kẻ nắm quyền cố gắng bám víu lấy những mảnh trật tự cuối cùng.";
        } else {
            return "Một thời kỳ hoàng kim rực rỡ đã bắt đầu. Sự dung hợp của $materials tạo nên một trật tự ổn định tuyệt mỹ (Entropy: $entropy). Nền văn minh mở rộng sự phức hợp của mình lên những tầm cao mới, nơi niềm tin vững chãi và sự sáng tạo không giới hạn dẫn dắt vạn vật hướng tới một tương lai vĩnh hằng.";
        }
    }
}
