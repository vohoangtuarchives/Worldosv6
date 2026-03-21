<?php

namespace Tests\Unit\Economics;

use App\Modules\Economics\Entities\Inventory;
use App\Modules\Economics\Services\BarterMarketResolver;
use App\Modules\Economics\Services\CraftingService;
use App\Modules\Economics\Services\HarvestingService;
use App\Modules\Economics\ValueObjects\Item;
use App\Modules\Economics\ValueObjects\TradeOffer;
use App\Modules\Geography\Entities\NaturalResource;
use Tests\TestCase;

class EconomicsTest extends TestCase
{
    public function test_inventory_enforces_weight_limit(): void
    {
        $inventory = new Inventory('actor1', 10.0); // Max 10kg
        
        $stone = new Item('1', 'stone', 2.0, 5.0); // 2 units * 5kg = 10kg
        $success = $inventory->addItem($stone);
        $this->assertTrue($success);
        
        $extraStone = new Item('2', 'stone', 1.0, 5.0); // 1 unit * 5kg = 5kg
        $success2 = $inventory->addItem($extraStone);
        $this->assertFalse($success2, "Should not be able to carry past 10kg");
    }

    public function test_inventory_merges_items_and_decays_food(): void
    {
        $inventory = new Inventory('actor1', 50.0);
        $food1 = new Item('f1', 'food', 10.0, 0.5, 1.0, 0.05); // 10 units, rate 0.05
        $food2 = new Item('f2', 'food', 5.0, 0.5, 0.5, 0.05);  // 5 units, rate 0.05, quality 0.5

        $inventory->addItem($food1);
        $inventory->addItem($food2);

        $items = $inventory->getItems();
        $this->assertCount(1, $items, "Items should be merged");

        $mergedItem = reset($items);
        $this->assertEquals(15.0, $mergedItem->quantity);
        // Average quality = (1*10 + 0.5*5) / 15 = 12.5 / 15 = 0.8333...
        $this->assertEqualsWithDelta(0.833, $mergedItem->quality, 0.01);

        // Tick decay
        $inventory->tickDecay();
        $this->assertEqualsWithDelta(0.833 - 0.05, $mergedItem->quality, 0.01);
    }

    public function test_harvesting_resource_respects_difficulty_and_weight_limit(): void
    {
        $service = new HarvestingService();
        $resource = new NaturalResource('res1', 'wood', 100.0, 100.0, 5.0, 2.0); // Difficulty 2.0
        
        $inventory = new Inventory('actor1', 10.0); // Max 10kg. Wood is 2kg/unit. Max can hold = 5 units.
        
        // Want to harvest 10 units, but inventory only holds 5 units.
        $harvested = $service->harvestResource($resource, $inventory, 10.0);
        
        // Harvest process: amountToAttempt = min(10, 5) = 5
        // effectiveHarvest = 5 / 2.0 (difficulty) = 2.5 units
        $this->assertEquals(2.5, $harvested);
        $this->assertEquals(97.5, $resource->currentAmount);
        $this->assertEquals(5.0, $inventory->getCurrentWeight()); // 2.5 * 2kg = 5kg
    }

    public function test_crafting_stone_axe_consumes_materials(): void
    {
        $service = new CraftingService();
        $inventory = new Inventory('actor1', 50.0);
        
        // Add 3 wood (6kg), 3 stone (15kg)
        $inventory->addItem(new Item('w', 'wood', 3.0, 2.0));
        $inventory->addItem(new Item('s', 'stone', 3.0, 5.0));

        $success = $service->craftStoneAxe($inventory);
        $this->assertTrue($success);

        $this->assertEquals(1.0, $inventory->getCategoryTotal('wood')); // 3 - 2
        $this->assertEquals(1.0, $inventory->getCategoryTotal('stone')); // 3 - 2
        
        // Check tool was added
        $hasAxe = false;
        foreach ($inventory->getItems() as $item) {
            if ($item->category === 'tool') {
                $hasAxe = true;
                break;
            }
        }
        $this->assertTrue($hasAxe);
    }

    public function test_barter_market_resolver_calculates_subjective_value(): void
    {
        $service = new BarterMarketResolver();
        $targetInventory = new Inventory('target', 50.0);
        // Target has 10 wood
        $targetInventory->addItem(new Item('w', 'wood', 10.0, 2.0));

        // Offer: Target gives 5 wood, gets 2 food.
        $offer = new TradeOffer(
            actorId: 'owner1',
            giveItems: [['category' => 'food', 'quantity' => 2.0]],   // Target gains 2 food
            requestItems: [['category' => 'wood', 'quantity' => 5.0]], // Target loses 5 wood
            createdAtTick: 1
        );

        // Case 1: Target is starving (Hunger = 1.0). Target values Food immensely (x6).
        // Gain: 2 * 6.0 = 12.0 value
        // Loss: 5 * 1.0 (Safety 0) = 5.0 value
        // 12.0 >= 5.0 -> ACCEPT
        $starvingAccept = $service->evaluateOffer($targetInventory, $offer, 1.0, 0.0, 0.0);
        $this->assertTrue($starvingAccept, "Starving AI should accept 2 food for 5 wood");

        // Case 2: Target is completely full (Hunger = 0.0). Target has high safety need (0.8).
        // Gain: 2 * 1.0 = 2.0 value
        // Loss: 5 * (1 + 0.8*3) = 5 * 3.4 = 17.0 value
        // 2.0 < 17.0 -> REJECT
        $fullReject = $service->evaluateOffer($targetInventory, $offer, 0.0, 0.8, 0.0);
        $this->assertFalse($fullReject, "Full AI needing safety should reject giving up wood for food");

        // Case 3: Trust changes margins. Trust = -1.0 (Hate). Target requires 110% profit margin (loss * 1.1).
        $hatedOffer = $service->evaluateOffer($targetInventory, $offer, 1.0, 0.0, -1.0);
        $this->assertFalse($hatedOffer, "Trust < -0.5 triggers automatic rejection");

        // Case 4: Target asked for 20 wood but only has 10.
        $impossibleOffer = new TradeOffer(
            actorId: 'owner1',
            giveItems: [['category' => 'food', 'quantity' => 20.0]],
            requestItems: [['category' => 'wood', 'quantity' => 20.0]], // 20 > 10
            createdAtTick: 1
        );
        $impossible = $service->evaluateOffer($targetInventory, $impossibleOffer, 1.0, 0.0, 0.0);
        $this->assertFalse($impossible, "Cannot trade what you do not have");
    }
}
