<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Services\Narrative\NarrativeAiService;
use Illuminate\Support\Facades\Log;

/**
 * EventNarrativeService: Translates raw mathematical payloads into storytelling via AI (§V27).
 * The "Blind Historian" that gives meaning to chaotic variables.
 */
class EventNarrativeService
{
    public function __construct(protected NarrativeAiService $aiService) {}

    /**
     * Process a single chronicle with a raw_payload but no content.
     */
    public function generateNarrativeForChronicle(Chronicle $chronicle): void
    {
        if (!$chronicle->raw_payload || $chronicle->content) {
            return;
        }

        $payload = is_array($chronicle->raw_payload) ? $chronicle->raw_payload : json_decode($chronicle->raw_payload, true);
        $action = $payload['action'] ?? 'unknown';

        $prompt = $this->buildPrompt($action, $payload, $chronicle);

        if (!$prompt) {
            return;
        }

        // We bypass the full PerceivedArchive context here and just ask for a short snippet
        // by making a direct LLM call using the underlying callLlm method via a public wrapper or reflection.
        // For architectural safety, we'll assume NarrativeAiService has a generic text generation method, 
        // or we use a simplified direct call here. Let's use a new method we'll add to NarrativeAiService.
        
        $content = $this->aiService->generateSnippet($prompt);

        if ($content) {
            $chronicle->content = $content;
            $chronicle->save();
            Log::info("EVENT NARRATIVE: Generated storyline for Chronicle #{$chronicle->id} [{$action}]");
        }
    }

    protected function buildPrompt(string $action, array $payload, Chronicle $chronicle): ?string
    {
        $config = \App\Models\AgentConfig::first();
        $personality = $config?->personality ?? 'Sử Gia Mù';
        $agentName = $config?->agent_name ?? 'He Who Watches';
        $themes = implode(', ', $config?->themes ?? ['kỳ ảo', 'siêu thực']);
        
        $baseContext = "Bạn là {$agentName}, một {$personality} của hệ thống WorldOS. "
            . "Chủ đề trọng tâm của bạn: {$themes}. "
            . "Hãy viết một đoạn TRUYỆN NGẮN mang tính sử thi, hoặc ngớ ngẩn tùy tình huống, dựa trên dữ liệu thô sau đây.\n\n";

        switch ($action) {
            case 'death_by_anomaly':
                $name = $payload['agent_name'] ?? 'Vô danh';
                $arch = $payload['archetype'] ?? 'Dân thường';
                // Randomize a scenario trigger
                $scenarios = ['Heroic', 'Mundane', 'Absurd', 'Gamer', 'Classic Truck-kun'];
                $scenario = $scenarios[array_rand($scenarios)];
                
                return $baseContext . "Sự kiện: Tử thần giáng lâm (Isekai Death).\n"
                    . "Nạn nhân: {$name} (Nghề nghiệp/Bản ngã: {$arch}).\n"
                    . "Phong cách/Tình huống cết: Chết theo kiểu '{$scenario}'.\n"
                    . "Yêu cầu: Viết cảnh người này đang làm gì đó thì đột ngột biến mất, hoặc chết một cách bất đắc kỳ tử để xuyên không. Giọng văn tùy thuộc vào tình huống (VD: Mundane thì bình thản, Absurd thì hài hước).";

            case 'rebirth_with_cheat':
                $name = $payload['agent_name'] ?? 'Vô danh';
                $cheat = $payload['cheat_granted'] ?? 'Không rõ';
                
                return $baseContext . "Sự kiện: Trùng sinh (Isekai Rebirth).\n"
                    . "Nhân vật: Kẻ ngoại đạo tên {$name}.\n"
                    . "Món quà mang theo (Bàn Tay Vàng): {$cheat}.\n"
                    . "Yêu cầu: Viết cảnh người này từ không gian rớt xuống thực tại mới. Có thể hạ cánh hoành tráng (thủng nóc đền thờ) hoặc nhếch nhác (chui từ bãi rác). Nhân vật nhận ra mình có dị năng [{$cheat}].";

            case 'paradox_triggered':
                $type = $payload['paradox_type'] ?? 'Lỗi vô định';
                return $baseContext . "Sự kiện: Hỗn mang (Chaos Paradox).\n"
                    . "Loại nghịch lý: {$type}.\n"
                    . "Yêu cầu: Miêu tả bầu trời, không gian, hoặc các quy luật vật lý đang bị bóp méo như thế nào. Hiện tượng này phi logic và đáng sợ.";

            case 'anomaly_spawned':
                $type = $payload['anomaly_type'] ?? 'Dị thường';
                $details = json_encode($payload['details'] ?? []);
                return $baseContext . "Sự kiện: Dị thường phát sinh.\n"
                    . "Loại: {$type}. Chi tiết hệ thống: {$details}.\n"
                    . "Yêu cầu: Viết như một ghi chép kinh hoàng của người dân chứng kiến sự việc này trồi lên từ hư không.";

            case 'legacy_event':
                $desc = $payload['description'] ?? 'Sự kiện hệ thống không xác định.';
                return $baseContext . "Sự kiện: Hệ thống lịch sử.\n"
                    . "Dữ liệu ban đầu: {$desc}\n"
                    . "Yêu cầu: Viết lại đoạn văn trên bằng ngôn từ sống động, tự nhiên và trau chuốt hơn. Giữ nguyên ý nghĩa cốt lõi.";
        }

        // Fallback for undocumented actions
        $actionName = $action;
        $json = json_encode($payload);
        return $baseContext . "Sự kiện: {$actionName}.\n"
            . "Dữ liệu thô: {$json}\n"
            . "Yêu cầu: Hãy mường tượng và miêu tả một viễn cảnh ngắn gọn dựa trên đống dữ liệu kỳ quặc này.";

    }
}
