<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class WorldOSOmegaPointCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'worldos:omega-point {universe_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kích hoạt Điểm Omega (Singularity) - Hợp nhất toàn bộ các tầng thực tại đệ quy.';

    /**
     * Execute the console command.
     */
    public function handle(\App\Actions\Simulation\TriggerOmegaPointAction $action)
    {
        $id = $this->argument('universe_id');
        $universe = \App\Models\Universe::find($id);

        if (!$universe) {
            $this->error("Vũ trụ #{$id} không tồn tại.");
            return 1;
        }

        $this->info("Đang khởi động tiến trình ĐIỂM OMEGA cho Vũ trụ #{$id}...");
        
        $result = $action->execute($universe);

        if ($result['ok']) {
            $this->info($result['message']);
        } else {
            $this->error($result['message']);
        }

        return 0;
    }
}
