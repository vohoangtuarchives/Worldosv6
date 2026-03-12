<?php

namespace App\Modules\Simulation\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Contracts\WorldEventBusInterface;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;

/**
 * Event Normalizer: chuyển trạng thái mô phỏng/raw data thành WorldEvent chuẩn cho Event Bus.
 *
 * Phase 1 (MVP): phát sinh một tick-level WorldEvent tóm tắt entropy/stability/metrics và quyết định AEE.
 * Các nguồn event chi tiết (BranchEvent, ActorEvent, engine chuyên biệt) sẽ được nối vào các phương thức khác ở Phase 2+.
 */
class EventNormalizer
{
    public function __construct(
        protected WorldEventBusInterface $eventBus,
    ) {
    }

    /**
     * Build (do not publish) a tick-summary WorldEvent for Narrative v2: Fact is recorded first, then event published.
     */
    public function buildTickSummaryEvent(Universe $universe, UniverseSnapshot $snapshot, array $decisionData = [], array $scars = []): ?WorldEvent
    {
        $tick = (int) ($snapshot->tick ?? 0);
        if ($tick < 0) {
            return null;
        }

        $metrics = (array) ($snapshot->metrics ?? []);

        $payload = [
            'entropy' => (float) ($snapshot->entropy ?? 0.0),
            'stability_index' => (float) ($snapshot->stability_index ?? 0.0),
            'metrics' => $metrics,
            'decision' => [
                'action' => $decisionData['action'] ?? null,
                'meta' => $decisionData['meta'] ?? [],
            ],
            'scars' => $scars,
        ];

        return WorldEvent::create(
            WorldEventType::PRESSURE_UPDATE,
            (int) $universe->id,
            $tick,
            null,
            [],
            0.0,
            [],
            $payload
        );
    }

    /**
     * Emit a high-level tick summary event (build + publish). Use buildTickSummaryEvent + record + publish for Narrative v2.
     */
    public function emitTickSummaryEvent(Universe $universe, UniverseSnapshot $snapshot, array $decisionData = []): void
    {
        $event = $this->buildTickSummaryEvent($universe, $snapshot, $decisionData);
        if ($event !== null) {
            $this->eventBus->publish($event);
        }
    }
}

