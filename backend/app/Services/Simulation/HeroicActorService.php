<?php

namespace App\Services\Simulation;

use App\Models\Actor;
use App\Models\Universe;
use App\Models\BranchEvent;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use App\Services\Narrative\NarrativeGeneratorService;

class HeroicActorService
{
    protected $narrativeService;

    public function __construct(NarrativeGeneratorService $narrativeService)
    {
        $this->narrativeService = $narrativeService;
    }

    public const TRAIT_DIMENSIONS = [
        'Dominance', 'Ambition', 'Coercion',
        'Loyalty', 'Empathy', 'Solidarity', 'Conformity',
        'Pragmatism', 'Curiosity', 'Dogmatism', 'RiskTolerance',
        'Fear', 'Vengeance', 'Hope', 'Grief', 'Pride', 'Shame'
    ];
    /**
     * Get genre configuration for the given universe.
     */
    protected function getGenreConfig(Universe $universe): array
    {
        $genre = $universe->world->current_genre ?? 'wuxia';
        return config("worldos_genres.genres.{$genre}") ?? config("worldos_genres.genres.wuxia");
    }

    /**
     * Spawn new actors from significant events in the simulation.
     */
    public function spawnFromEvents(Universe $universe, int $tick): void
    {
        // Find events that haven't been processed into actors yet
        $events = BranchEvent::where('universe_id', $universe->id)
            ->where('event_type', 'micro_crisis')
            ->where('from_tick', '>=', $tick - 10)
            ->get();

        foreach ($events as $event) {
            $payload = $event->payload;
            if (isset($payload['winner'])) {
                $this->createPersistentActor($universe, $payload['winner'], "Ghi danh bảng vàng sau biến cố: " . ($payload['description'] ?? 'Loạn lạc'));
            }
        }
        
        // Ensure population minimum (Always 5)
        while (Actor::where('universe_id', $universe->id)->where('is_alive', true)->count() < 5) {
             $this->createSpontaneousActor($universe);
        }
    }

    /**
     * Evolve existing actors: update traits, age them, or record life events.
     */
    public function evolve(Universe $universe, int $tick): void
    {
        $genreConfig = $this->getGenreConfig($universe);
        $actors = Actor::where('universe_id', $universe->id)->where('is_alive', true)->get();

        foreach ($actors as $actor) {
            $traits = $actor->traits;
            
            // Trait drift (±2%)
            foreach ($traits as &$val) {
                $val = max(0, min(1, $val + (rand(-2, 2) / 100)));
            }
            $actor->traits = $traits;
            
            // Random life record (chance 20% per pulse)
            if (rand(1, 100) > 80) {
                $record = $this->generateLifeRecord($actor, $genreConfig);
                $actor->biography .= "\n- T" . $tick . ": " . $record;
                
                // Increase influence on meaningful events
                $metrics = $actor->metrics;
                $metrics['influence'] = ($metrics['influence'] ?? 0) + 0.1;
                $actor->metrics = $metrics;
            }

            // Life cycle
            $chanceOfDeath = 0.005; // Base 0.5%
            if (($actor->metrics['influence'] ?? 0) > 5.0) $chanceOfDeath = 0.02;

            if (rand(0, 1000) / 1000 < $chanceOfDeath) {
                $actor->is_alive = false;
                $actor->biography .= "\n- T" . $tick . ": Kết thúc một chương huyền thoại.";
            }

            $actor->save();
        }
    }

    protected function createPersistentActor(Universe $universe, array $data, string $initialEvent): void
    {
        $genreConfig = $this->getGenreConfig($universe);
        $archetype = $data['archetype'] ?? $genreConfig['archetypes'][array_rand($genreConfig['archetypes'])] ?? 'Kẻ Lang Thang';
        $name = $data['name'] ?? $this->generateName($archetype, $genreConfig);
        
        if (Actor::where('universe_id', $universe->id)->where('name', $name)->exists()) {
            return;
        }

        Actor::create([
            'universe_id' => $universe->id,
            'name' => $name,
            'archetype' => $archetype,
            'traits' => $data['traits'] ?? $this->generateRandomTraits(),
            'biography' => "Gốc gác: " . $initialEvent,
            'is_alive' => true,
            'generation' => 1,
            'metrics' => ['influence' => 1.0],
        ]);
    }

    protected function createSpontaneousActor(Universe $universe): void
    {
        $genreConfig = $this->getGenreConfig($universe);
        $archetypes = $genreConfig['archetypes'] ?? ['Kẻ Lang Thang'];
        $archetype = $archetypes[array_rand($archetypes)];
        $name = $this->generateName($archetype, $genreConfig);

        Actor::create([
            'universe_id' => $universe->id,
            'name' => $name,
            'archetype' => $archetype,
            'traits' => $this->generateRandomTraits(),
            'biography' => "Cảm ứng thiên địa, xuất thế giữa lúc năng lượng dao động mạnh.",
            'is_alive' => true,
            'generation' => 1,
            'metrics' => ['influence' => 0.5],
        ]);
    }

    protected function generateRandomTraits(): array
    {
        $traits = [];
        foreach (self::TRAIT_DIMENSIONS as $dim) {
            $traits[] = rand(0, 100) / 100.0;
        }
        return $traits;
    }

    protected function generateName(string $archetype, array $config): string
    {
        $style = $config['naming_style'] ?? 'asian_classic';
        
        if ($style === 'asian_classic' || $style === 'asian_mythic') {
            $prefixes = ['Độc Cô', 'Mộ Dung', 'Âu Dương', 'Lệnh Hồ', 'Đường', 'Vân', 'Thanh', 'Huyền', 'Phong', 'Bạch'];
            $suffixes = ['Thiên', 'Kiếm', 'Môn', 'Sư', 'Tôn', 'Dạ', 'Nguyệt', 'Thần', 'Long', 'Lão'];
            return $prefixes[array_rand($prefixes)] . " " . $suffixes[array_rand($suffixes)];
        } elseif ($style === 'numerical' || $style === 'modern') {
            $prefixes = ['Kaito', 'Unit', 'Nexus', 'Cypher', 'Nova', 'Rex', 'Omega', 'Vanguard', 'Sigma'];
            $suffixes = [rand(10, 99), 'X', 'Prime', 'Zero', 'Beta'];
            return $prefixes[array_rand($prefixes)] . "-" . $suffixes[array_rand($suffixes)];
        }
        
        return "Unknown Entity " . rand(100, 999);
    }

    protected function generateLifeRecord(Actor $actor, array $config): string
    {
        // Try AI generation first
        try {
            return $this->narrativeService->generateLifeEvent(
                $actor->name,
                $actor->archetype,
                $actor->traits,
                ['genre' => $config['genre'] ?? 'wuxia', 'style' => $config['naming_style'] ?? 'asian_classic']
            );
        } catch (\Exception $e) {
            // Fallback to template based logic
        }

        // Simple contextual mapping based on style
        $style = $config['naming_style'] ?? 'asian_classic';
        
        if ($style === 'numerical') {
            $pool = [
                "Nâng cấp module thần kinh thành công, hiệu suất đạt 120%.",
                "Thâm nhập vào hệ thống lõi của đối phương, đánh cắp mã nguồn.",
                "Tham gia một cuộc chiến băng đảng ở khu ổ chuột, trở thành huyền thoại.",
                "Thức tỉnh năng lực điều khiển máy móc từ xa."
            ];
        } else {
            $pool = [
                "Đang bế quan cảm ngộ đạo trời, thực lực tăng tiến.",
                "Chu du tứ hải, kết giao thêm nhiều bằng hữu kỳ dị.",
                "Trải qua một kiếp nạn tâm linh, thấu hiểu nhân quả.",
                "Tàn sát một tổ chức đối nghịch, gieo rắc nỗi kinh hoàng.",
                "Hóa giải một cuộc xung đột lớn, cứu vạn dân khỏi lầm than."
            ];
        }

        return $pool[array_rand($pool)];
    }
}
