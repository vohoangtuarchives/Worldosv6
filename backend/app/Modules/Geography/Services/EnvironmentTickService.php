<?php

namespace App\Modules\Geography\Services;

use App\Modules\Geography\Entities\NaturalResource;
use App\Modules\Geography\ValueObjects\Tile;
use App\Modules\Geography\ValueObjects\Weather;
use Illuminate\Support\Str;

class EnvironmentTickService
{
    /**
     * Xử lý vòng lặp Environment (Tick): 
     * 1. Hồi phục tài nguyên (dựa theo thời tiết)
     * 2. Giảm duration của Weather hiện tại, có thể tạo weather mới nếu hết hạn
     *
     * @param array<string, NaturalResource> $resources Array of NaturalResource
     * @param Weather $currentWeather
     * @param int $tick
     * @return array{0: array<string, NaturalResource>, 1: Weather} Mảng Resources đã update và Weather mới nhất
     */
    public function tickEnvironment(array $resources, Weather $currentWeather, int $tick): array
    {
        // 1. Roll or decay Weather
        $nextWeather = $this->updateWeather($currentWeather);
        
        // 2. Tốc độ mọc cây bị ảnh hưởng bởi Weather
        $regenMultiplier = $nextWeather->getRegenerationMultiplier();

        $updatedResources = [];
        foreach ($resources as $id => $resource) {
            // Không thao tác reference trực tiếp để đảm bảo luồng state rõ ràng nếu muốn bất biến
            $resource->regenerate($regenMultiplier);
            
            // Xóa tài nguyên đào đã cạn kiệt (không thể mọc lại)
            if (!$resource->isDepleted()) {
                $updatedResources[$id] = $resource;
            }
        }

        return [$updatedResources, $nextWeather];
    }

    private function updateWeather(Weather $current): Weather
    {
        $timeRemaining = $current->durationTicks - 1;

        if ($timeRemaining > 0) {
            return new Weather($current->type, $timeRemaining, $current->intensity);
        }

        // Đã hết thời hạn Weather cũ, random tạo Weather mới (Đơn giản hóa)
        $weatherTypes = [
            Weather::TYPE_CLEAR, Weather::TYPE_CLEAR, Weather::TYPE_CLEAR, // Dễ nắng nhất
            Weather::TYPE_RAIN, Weather::TYPE_RAIN,
            Weather::TYPE_DROUGHT,
            Weather::TYPE_STORM,
            Weather::TYPE_SNOW
        ];
        
        $newType = $weatherTypes[array_rand($weatherTypes)];
        $duration = rand(5, 20); // Thời tiết kéo dài bao nhiêu ticks
        $intensity = mt_rand(5, 10) / 10;

        return new Weather($newType, $duration, $intensity);
    }

    /**
     * Khởi tạo bản đồ ngẫu nhiên cho 1 Zone
     */
    public function initializeZoneResources(Tile $tile): array
    {
        $resources = [];

        // Dựa vào Biome để sinh đồ
        switch ($tile->biome) {
            case Tile::BIOME_FOREST:
                // Sinh nhiều gỗ, trái cây
                $idWood = (string) Str::uuid();
                $resources[$idWood] = new NaturalResource($idWood, NaturalResource::CATEGORY_WOOD, 500, 500, 2.0, 1.5);
                
                $idFood = (string) Str::uuid();
                $resources[$idFood] = new NaturalResource($idFood, NaturalResource::CATEGORY_FOOD, 100, 100, 5.0, 1.0);
                break;
                
            case Tile::BIOME_MOUNTAIN:
                // Sinh đa số là đá, quặng, rất ít thức ăn
                $idStone = (string) Str::uuid();
                $resources[$idStone] = new NaturalResource($idStone, NaturalResource::CATEGORY_STONE, 1000, 1000, 0.0, 3.0);
                
                $idOre = (string) Str::uuid();
                $resources[$idOre] = new NaturalResource($idOre, NaturalResource::CATEGORY_MINERAL, 200, 200, 0.0, 5.0);
                break;

            case Tile::BIOME_PLAINS:
                // Thực phẩm cỏ, ít gỗ
                $idFood = (string) Str::uuid();
                $resources[$idFood] = new NaturalResource($idFood, NaturalResource::CATEGORY_FOOD, 200, 200, 3.0, 1.0);
                
                $idWood = (string) Str::uuid();
                $resources[$idWood] = new NaturalResource($idWood, NaturalResource::CATEGORY_WOOD, 50, 50, 1.0, 1.5);
                break;
        }

        return $resources;
    }
}
