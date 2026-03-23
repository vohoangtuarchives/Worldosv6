<?php

namespace App\Modules\Simulation\Core\Domain\Pipelines\Steps;

use App\Models\World;
use App\Models\Universe;

/**
 * Interface cho các bước trong SpawnPipeline.
 */
interface SpawnStepInterface
{
    /**
     * Thực thi bước logic.
     * 
     * @param array $context Dữ liệu dùng chung giữa các bước.
     * @return array Context đã được cập nhật.
     */
    public function execute(array $context): array;
}

