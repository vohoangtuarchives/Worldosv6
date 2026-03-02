# 03 — The Simulation Loop

## 3.1 The "Heartbeat" (Command)
The system is driven by a single valid console command:
`php artisan saga:advance-v3 --ticks=5`

This command runs every minute via the Scheduler.

## 3.2 Component Flow

### Step 1: Entry Point
`SagaService::runBatchWithEvaluation($saga, $ticks)`
- Loads the active Universe for the Saga.
- Calls `UniverseRuntimeService`.

### Step 2: Runtime Environment
`UniverseRuntimeService::advance($universeId)`
- Loads the `UniverseModel`.
- Checks if the World is `HALTED` (Paused).
- Delegates to the Kernel: `evolutionEngine->applyTick()`.

### Step 3: The Kernel (Physics)
`WorldEvolutionKernel::tickUniverse()`
- **Input**: Current State Vector.
- **Process**:
    1.  `BasePhysicsEngine::evolve()`: Calculates differentials (dEntropy, dOrder, etc.).
    2.  `MaterialWorldBridge::processTick()`: Applies modifiers from active Materials.
    3.  `StateLoader::saveVector()`: Updates the Universe state.
- **Output**: New State Vector.

### Step 4: Event Dispatch
The Kernel fires:
- `App\Domains\Evolution\Events\WorldTicked`
- Payload: `World`, `StateVector`.

### Step 5: Resonance (Narrative)
Listeners catch the event:
- `CheckHeroSpawningListener`: Checks vector thresholds.
    - If `Entropy > 0.8`: Spawns `REBEL` Hero.
    - If `Order > 0.9`: Spawns `REFORMER` Hero.
- This creates `WorldHero` records *without* needing a complex AI agent loop.
