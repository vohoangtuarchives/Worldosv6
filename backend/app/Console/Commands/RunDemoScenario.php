<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Multiverse;
use App\Models\World;
use App\Models\Saga;
use App\Models\Universe;
use App\Actions\Simulation\AdvanceSimulationAction;
use App\Services\Saga\SagaService;
use App\Services\Narrative\NarrativeAiService;

class RunDemoScenario extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'worldos:demo-scenario';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Runs a standard demo scenario: Genesis -> Stability -> Crisis -> Fork';

    /**
     * Execute the console command.
     */
    public function handle(AdvanceSimulationAction $action, SagaService $sagaService, NarrativeAiService $narrative)
    {
        $this->info("--- Starting WorldOS V6 Demo Scenario ---");

        // Ensure Multiverse exists
        $multiverse = Multiverse::firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'Default Multiverse']
        );

        // 1. Setup World & Saga
        $this->info("[1/4] Genesis: Creating World and Saga...");
        $world = World::firstOrCreate(
            ['slug' => 'demo-world'],
            ['name' => 'Demo World', 'multiverse_id' => $multiverse->id]
        );
        
        $sagaName = 'Demo Saga ' . now()->format('H:i:s');
        $saga = Saga::create([
            'name' => $sagaName,
            'world_id' => $world->id,
            'status' => 'active',
        ]);

        // Initialize Universe
        $universe = $sagaService->spawnUniverse($world, null, $saga->id);
        $this->info("      Created Universe ID: {$universe->id}");

        // 2. Stable Era
        $this->info("[2/4] The Golden Age: Running 10 stable ticks...");
        $bar = $this->output->createProgressBar(10);
        $bar->start();
        for ($i = 0; $i < 10; $i++) {
            $action->execute($universe->id, 1);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();

        // 3. The Crisis
        $this->info("[3/4] The Crisis: Injecting High Entropy...");
        $universe->refresh();
        $vec = $universe->state_vector ?? [];
        
        // Inject global metadata
        $vec['entropy'] = 0.85; // Critical threshold
        $vec['scars'] = ['pre_war_tension'];

        // Inject into ZONES (Crucial for Engine Physics)
        $injectedCount = 0;
        
        // Handle explicit 'zones' structure
        if (isset($vec['zones']) && is_array($vec['zones'])) {
            foreach ($vec['zones'] as $idx => $zone) {
                if (isset($zone['state'])) {
                    $vec['zones'][$idx]['state']['entropy'] = 0.95;
                    // Inject Material: "Unstable Reactor"
                    $vec['zones'][$idx]['state']['active_materials'] = [
                        [
                            'slug' => 'unstable_reactor',
                            'output' => 1.0,
                            'pressure_coefficients' => [
                                'entropy' => 0.1, // Adds 0.1 entropy per tick (scaled by 0.01 in engine -> 0.001)
                                'innovation' => 0.5,
                            ]
                        ]
                    ];
                    $injectedCount++;
                }
            }
        } 
        // Handle flat array structure (numeric keys)
        else {
            foreach ($vec as $key => $val) {
                if (is_int($key) && is_array($val) && isset($val['state'])) {
                    $vec[$key]['state']['entropy'] = 0.95;
                    // Inject Material: "Unstable Reactor"
                    $vec[$key]['state']['active_materials'] = [
                        [
                            'slug' => 'unstable_reactor',
                            'output' => 1.0,
                            'pressure_coefficients' => [
                                'entropy' => 0.1,
                                'innovation' => 0.5,
                            ]
                        ]
                    ];
                    $injectedCount++;
                }
            }
        }
        
        $universe->update(['state_vector' => $vec]);
        $this->info("      Entropy set to 0.85 (Global) / 0.95 (Zones). Affected {$injectedCount} zones.");
        $this->info("      System destabilized.");

        $this->info("      Running 5 ticks to trigger Decision Engine...");
        for ($i = 0; $i < 5; $i++) {
            $res = $action->execute($universe->id, 1);
            $snap = $res['snapshot'] ?? [];
            $e = $snap['entropy'] ?? 'N/A';
            $this->line("      Tick +1 | Entropy: {$e}");
        }

        // 4. The Fork
        $this->info("[4/4] The Aftermath: Checking for Forks...");
        $forks = \App\Models\Universe::where('parent_universe_id', $universe->id)->get();
        
        if ($forks->count() > 0) {
            $this->info("SUCCESS: System forked! Created " . $forks->count() . " new universe(s).");
            foreach ($forks as $fork) {
                $this->line("      - Fork ID: {$fork->id} (Parent: {$universe->id})");
            }
        } else {
            $this->warn("WARNING: System did not fork. Check DecisionEngine logic.");
        }

        // [5/5] Narrative Generation
        $this->info("[5/5] Narrative: Generating Chronicle for the Crisis...");
        // Generate for the last 5 ticks (crisis period)
        $chronicle = $narrative->generateChronicle($universe->id, 11, 15, 'chronicle');
        if ($chronicle) {
            $this->info("Chronicle: " . $chronicle->content);
        } else {
            $this->warn("Could not generate chronicle.");
        }

        $this->info("--- Demo Scenario Complete ---");
        $this->info("Visit the Dashboard to see the Multiverse Graph and Chronicles.");
    }
}
