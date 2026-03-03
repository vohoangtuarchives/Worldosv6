<?php

namespace App\Modules\Institutions\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use App\Models\MaterialInstance;
use Illuminate\Support\Facades\DB;

class AscensionEngine
{
    /**
     * Evaluate cosmic-level events (Ascension or Eschaton) based on the latest snapshot.
     */
    public function evaluate(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $metrics = $snapshot->metrics ?? [];
        $entropy = (float) ($snapshot->entropy ?? 0);
        
        // Extract order and energy_level from metrics or state_vector
        $order = (float) ($metrics['order'] ?? 0);
        $energyLevel = (float) ($metrics['energy_level'] ?? 0);

        // 1. Eschaton (Tịch Diệt) - Entropy death
        if ($entropy >= 0.99) {
            $this->triggerEschaton($universe, $snapshot);
            return;
        }

        // 2. Ascension (Phi Thăng) - Transcending the phase space
        if ($order >= 0.95 && $energyLevel >= 0.95) {
            $this->triggerAscension($universe, $snapshot);
            return;
        }
    }

    protected function triggerEschaton(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $oldEpoch = $universe->epoch ?? 1;
        $newEpoch = $oldEpoch + 1;

        // Reset Universe metrics to primordial state
        $universe->update([
            'epoch' => $newEpoch,
            'level' => 1, // Reset level on death
            'status' => 'restarting',
        ]);

        // Lore
        $content = "Tiếng chuông lụi tàn điểm. Kỷ nguyên {$oldEpoch} sụp đổ trong biển Entropy hỗn loạn. Chư thần ngã xuống, vạn vật tan biến vào hư vô... Một mầm sống mới đang nảy nở từ đống tro tàn của Epoch {$newEpoch}.";
        
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $snapshot->tick,
            'to_tick' => $snapshot->tick,
            'type' => 'eschaton',
            'content' => $content,
        ]);

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $snapshot->tick,
            'event_type' => 'eschaton_reset',
            'payload' => [
                'old_epoch' => $oldEpoch,
                'new_epoch' => $newEpoch,
                'cause' => 'Entropy Saturation',
            ],
        ]);

        // Hard Reset: Clear all material instances (they dissolve in entropy death)
        MaterialInstance::where('universe_id', $universe->id)->delete();
        
        // Update snapshot metrics to reflect the reset for the next tick
        $metrics = $snapshot->metrics ?? [];
        $metrics['order'] = 0.05;
        $metrics['entropy'] = 0.5; // Primordial chaos
        $metrics['energy_level'] = 0.1;
        $snapshot->update(['metrics' => $metrics, 'entropy' => 0.5]);
    }

    protected function triggerAscension(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $oldLevel = $universe->level ?? 1;
        $newLevel = $oldLevel + 1;

        $universe->update([
            'level' => $newLevel,
        ]);

        // Lore
        $content = "Trời đất rung chuyển, rào cản thứ nguyên nứt vỡ. Thế giới tắm trong kim quang rực rỡ khi vượt qua ngưỡng giới hạn của Cấp độ {$oldLevel}. Toàn bộ vũ trụ đã Phi Thăng lên Tầng Thứ {$newLevel}!";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $snapshot->tick,
            'to_tick' => $snapshot->tick,
            'type' => 'ascension',
            'content' => $content,
        ]);

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $snapshot->tick,
            'event_type' => 'universal_ascension',
            'payload' => [
                'old_level' => $oldLevel,
                'new_level' => $newLevel,
            ],
        ]);

        // Reward: Boost supreme entities power
        $universe->supremeEntities()->update(['power_level' => DB::raw('LEAST(1.0, power_level + 0.1)')]);
    }
}
