<?php

namespace App\Modules\Institutions\Actions;

use App\Models\Universe;
use App\Modules\Institutions\Contracts\InstitutionalRepositoryInterface;
use App\Modules\Institutions\Entities\InstitutionalEntity;

class SpawnInstitutionAction
{
    public function __construct(
        private InstitutionalRepositoryInterface $institutionalRepository
    ) {}

    public function handle(Universe $universe, int $zoneId, int $tick, string $type): InstitutionalEntity
    {
        $name = $this->generateName($type);

        $entity = new InstitutionalEntity(
            id: null,
            universeId: $universe->id,
            name: $name,
            entityType: $type,
            ideologyVector: $this->randomIdeology(),
            influenceMap: ["$zoneId" => 0.25],
            orgCapacity: 15.0,
            institutionalMemory: 0.5,
            legitimacy: 0.5,
            spawnedAtTick: $tick
        );

        $this->institutionalRepository->save($entity);

        return $entity;
    }

    private function generateName(string $type): string
    {
        $prefixes = [
            'cult' => ['U minh', 'Huyền ảo', 'Hư vô', 'Tà phái', 'Thiên đạo'],
            'order' => ['Hoàng gia', 'Thánh khiết', 'Trưởng lão', 'Chính nghĩa', 'Hàn lâm'],
            'rebel' => ['Khởi nghĩa', 'Tự do', 'Bóng đêm', 'Phá xiềng', 'Rạng đông'],
            'civilization' => ['Đại', 'Cổ', 'Tân', 'Thần', 'Lạc']
        ];
        
        $suffixes = [
            'cult' => ['Giáo', 'Hội', 'Tông', 'U cung', 'Miếu'],
            'order' => ['Hội', 'Hiệp hội', 'Viện', 'Môn', 'Các'],
            'rebel' => ['Quân', 'Đoàn', 'Mạng', 'Hội', 'Đảng'],
            'civilization' => ['Quốc', 'Bang', 'Tộc', 'Triều', 'Đế Chế']
        ];
        
        $typeKey = $type === 'CIVILIZATION' ? 'civilization' : $type;
        $prefix = $prefixes[$typeKey][array_rand($prefixes[$typeKey])] ?? 'Vô danh';
        $suffix = $suffixes[$typeKey][array_rand($suffixes[$typeKey])] ?? 'Thể';
        
        return $prefix . ' ' . $suffix . ' - ' . mt_rand(100, 999);
    }

    private function randomIdeology(): array
    {
        return [
            'tradition' => (mt_rand(0, 100) / 100.0),
            'innovation' => (mt_rand(0, 100) / 100.0),
            'trust' => (mt_rand(0, 100) / 100.0),
            'violence' => (mt_rand(0, 100) / 100.0),
            'respect' => (mt_rand(0, 100) / 100.0),
            'myth' => (mt_rand(0, 100) / 100.0),
        ];
    }
}
