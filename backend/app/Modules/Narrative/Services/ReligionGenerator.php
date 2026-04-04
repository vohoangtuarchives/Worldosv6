<?php

namespace App\Modules\Narrative\Services;

use App\Models\Actor;
use App\Models\Chronicle;
use App\Models\Civilization;
use App\Models\Myth;
use App\Models\Religion;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

class ReligionGenerator
{
    public function generateFromMyth($myth): void
    {
        if (!$myth instanceof Myth) {
            return;
        }

        $universe = Universe::query()->with('latestSnapshot')->find($myth->universe_id);
        if (!$universe) {
            return;
        }

        $religion = Religion::query()->firstOrNew([
            'universe_id' => $universe->id,
            'origin_myth_id' => $myth->id,
        ]);

        $founderActorId = $this->resolveFounderActorId($myth, $universe);
        $holySites = $this->extractHolySites($universe);

        $religion->name = $religion->name ?: $this->buildReligionName($myth, $universe);
        $religion->founder_actor_id = $founderActorId;
        $religion->doctrine = $this->buildDoctrine($myth, $universe);
        $religion->spread_rate = max(0.03, min(0.25, 0.04 + ((float) $myth->impact * 0.2)));
        $religion->holy_sites = $holySites;
        $religion->save();

        $initialFollowers = $this->seedFollowers($religion, $universe);
        $religion->followers = $religion->actors()->count();
        $religion->save();

        Civilization::query()
            ->where('universe_id', $universe->id)
            ->whereNull('dominant_religion_id')
            ->update(['dominant_religion_id' => $religion->id]);

        $foundingTick = (int) ($myth->chronicle?->from_tick ?? $universe->current_tick ?? 0);
        $foundingContent = "{$religion->name} emerged from myth #{$myth->id} with {$initialFollowers} founding followers.";

        Chronicle::query()->firstOrCreate(
            [
                'universe_id' => $universe->id,
                'type' => 'religion_founded',
                'from_tick' => $foundingTick,
                'to_tick' => (int) ($myth->chronicle?->to_tick ?? $universe->current_tick ?? 0),
                'content' => $foundingContent,
            ],
            [
                'actor_id' => $founderActorId,
                'importance' => max(0.55, min(0.95, (float) $myth->impact + 0.1)),
                'raw_payload' => [
                    'origin_myth_id' => $myth->id,
                    'religion_id' => $religion->id,
                    'holy_sites' => $holySites,
                ],
            ]
        );

        Log::info('NarrativeLoom: religion generated', [
            'universe_id' => $universe->id,
            'religion_id' => $religion->id,
            'origin_myth_id' => $myth->id,
            'followers' => $religion->followers,
        ]);
    }

    protected function resolveFounderActorId(Myth $myth, Universe $universe): ?int
    {
        $chronicleActorId = $myth->chronicle?->actor_id;
        if ($chronicleActorId) {
            return (int) $chronicleActorId;
        }

        return Actor::query()
            ->where('universe_id', $universe->id)
            ->where('is_alive', true)
            ->orderBy('id')
            ->value('id');
    }

    protected function buildReligionName(Myth $myth, Universe $universe): string
    {
        $material = (string) data_get($universe->latestSnapshot?->metrics, 'material_identity.primary_material', 'origin');
        $livelihood = (string) data_get($universe->latestSnapshot?->metrics, 'material_identity.primary_livelihood', 'survival');
        $type = strtolower((string) $myth->myth_type);

        return match ($type) {
            'oikos' => 'Đạo ' . ucfirst($material) . ' và ' . ($livelihood === 'fishing' ? 'Đại dương' : ($livelihood === 'mining' ? 'Lòng đất' : 'Đất mẹ')),
            'martyr' => 'Giáo ước Sinh tồn ' . ucfirst($material),
            'origin' => 'Truyền thống Chư thần ' . ucfirst($material),
            'covenant' => 'Hội thánh ' . ucfirst($material) . ' Linh thiêng',
            default => 'Linh phái ' . ucfirst($material),
        };
    }

    protected function buildDoctrine(Myth $myth, Universe $universe): string
    {
        $state = $universe->latestSnapshot?->state_vector ?? [];
        $materialIdentity = (string) data_get($universe->latestSnapshot?->metrics, 'material_identity.primary_livelihood', 'survival');
        
        // Lấy thông tin văn hóa từ Zone đầu tiên làm mẫu
        $culturalArtifacts = data_get($state, 'zones.0.state.culture_profile.cultural_artifacts', []);
        $rituals = $culturalArtifacts['rituals'] ?? 'sự tôn kính tự nhiên';
        $taboo = $culturalArtifacts['taboo'] ?? 'vi phạm trật tự chung';

        return trim("Giáo lý hình thành quanh huyền thoại {$myth->myth_type}: {$myth->story}. Đạo dạy tín đồ thực hành nghi lễ '{$rituals}' để bảo tồn nguồn sống từ {$materialIdentity}. Điều cấm kỵ tối thượng là '{$taboo}', kẻ vi phạm sẽ bị vật chất ruồng bỏ.");
    }

    protected function extractHolySites(Universe $universe): array
    {
        $settlements = (array) data_get($universe->latestSnapshot?->state_vector, 'civilization.settlements', []);
        $holySites = [];

        foreach (array_slice($settlements, 0, 3) as $settlement) {
            if (is_array($settlement)) {
                $holySites[] = $settlement['name'] ?? ('Zone ' . ($settlement['zone_id'] ?? 'unknown'));
            } else {
                $holySites[] = (string) $settlement;
            }
        }

        if ($holySites === []) {
            $holySites[] = 'Origin Sanctuary';
        }

        return array_values(array_unique(array_filter($holySites)));
    }

    protected function seedFollowers(Religion $religion, Universe $universe): int
    {
        $aliveActors = Actor::query()
            ->where('universe_id', $universe->id)
            ->where('is_alive', true)
            ->whereDoesntHave('religions')
            ->orderBy('id')
            ->get(['id']);

        $targetCount = max(3, (int) ceil($aliveActors->count() * max(0.05, min(0.18, $religion->spread_rate))));
        $selected = $aliveActors->take($targetCount);

        if ($selected->isNotEmpty()) {
            $religion->actors()->syncWithoutDetaching(
                $selected->pluck('id')->mapWithKeys(
                    fn (int $actorId) => [$actorId => ['believed_at_tick' => (int) ($universe->current_tick ?? 0)]]
                )->all()
            );
        }

        return $selected->count();
    }
}
