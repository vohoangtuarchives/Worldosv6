# Cleanup & VAF Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up technical debt (root file clutter, Neo4j health check, linting), then begin VAF implementation (Tasks 1-5 of the full VAF plan: Pydantic schemas, VFX Director upgrade, backend migration + API + tests).

**Architecture:** Cleanup is independent quick fixes. VAF Phase 1 covers the Python narrative-loom schema changes and backend Laravel API to store/serve animation scripts. No frontend changes in this phase.

**Tech Stack:** PHP 8.3 (Laravel 13), Python (Pydantic), Docker Compose, Laravel Pint

**Full VAF Plan:** `docs/superpowers/plans/2026-04-10-vaf-visual-animation-framework.md`

---

## File Structure

### Cleanup - Modified/Deleted Files

| File | Action | Responsibility |
|------|--------|----------------|
| Root `*.txt`, `*.csv`, analysis `*.md` files | Delete (17 files) | Remove research artifacts from root |
| `deployment/docker-compose.prod.yml` (line 77) | Modify | Fix Neo4j health check to handle auth |
| `backend/app/Modules/Simulation/Console/Commands/HealthCheckCommand.php` (line 87-116) | Modify | Fix Neo4j health check to use auth |

### VAF Phase 1 - Files (from full VAF plan)

| File | Action | Responsibility |
|------|--------|----------------|
| `narrative-loom/schemas.py` | Modify | Add AnimationScript Pydantic models |
| `narrative-loom/state.py` | Modify | Add animation_script field to NarrativeState |
| `narrative-loom/agents/vfx_director.py` | Modify | Upgrade VFX Director to produce animation_script |
| `narrative-loom/graph_builder.py` | Modify | Reorder VFX Director after Wordsmith |
| `narrative-loom/tests/test_agents.py` | Modify | Add VFX Director tests |
| `backend/database/migrations/2026_04_13_100001_add_animation_script_to_chronicles_table.php` | Create | Add animation_script JSON column |
| `backend/app/Models/Chronicle.php` | Modify | Add animation_script to fillable + casts |
| `backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php` | Modify | Include has_animation flag |
| `backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php` | Modify | Add chronicle detail endpoint |
| `backend/app/Modules/WorldOS/routes/api.php` | Modify | Add chronicle detail route |
| `backend/tests/Feature/ChronicleAnimationTest.php` | Create | Test animation_script API |

---

## Part A: Cleanup (Tasks 1-3)

### Task 1: Remove Root Research Artifacts

**Files:**
- Delete: 17 files from project root (see list below)

- [ ] **Step 1: Delete research/analysis artifacts**

Delete these files from the project root — they are leftover research artifacts from previous sessions, not part of the codebase:

```bash
rm -f DECISION_SUMMARY.txt \
  ECONOMIC_SOCIAL_ENGINE_LANDSCAPE.md \
  ENGINE_ARCHITECTURE_SUMMARY.md \
  ENGINE_DECISION_TABLE.md \
  ENGINE_MAPPING_SUMMARY.md \
  ENGINE_TEST_COVERAGE.csv \
  FILES_READ.txt \
  FRONTEND_BACKEND_INTEGRATION_MAP.md \
  INTEGRATION_REPORT_SUMMARY.md \
  SOCIAL_ENGINES_IMPLEMENTATION_SPEC.md \
  STUB_ENGINE_ANALYSIS.md \
  TEST_COVERAGE_AUDIT.txt \
  TEST_COVERAGE_DETAILED_MATRIX.md \
  WEBSOCKET_UPGRADE_ANALYSIS.md \
  hub.txt \
  tmp_test.txt \
  "C:projectsIPFactorydocssuperpowersplanstest.txt"
```

Do NOT delete: `CLAUDE.md`, `AI_CONTEXT.md`, `DOCKER_GUIDE.md`, `.dev_status.md`, `WORLDOS_ARCHITECTURE_OVERVIEW.md`, `WORLDOS_EXPLORATION_INDEX.md`, `WORLDOS_QUICK_REFERENCE.md`, `WORLDOS_V6_SIMULATION_GUIDE.md` (these are project documentation).

- [ ] **Step 2: Verify cleanup**

Run: `ls *.md *.txt *.csv 2>/dev/null`
Expected: Only `AI_CONTEXT.md`, `CLAUDE.md`, `DOCKER_GUIDE.md`, `WORLDOS_*.md` remain. No `.txt` or `.csv` files.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove research artifacts from project root

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

### Task 2: Fix Neo4j Health Check

**Files:**
- Modify: `deployment/docker-compose.prod.yml:77`
- Modify: `backend/app/Modules/Simulation/Console/Commands/HealthCheckCommand.php:87-116`

**Problem:** Neo4j requires auth (`NEO4J_AUTH=neo4j/worldos_secret`), but both the Docker health check and the PHP HealthCheckCommand make unauthenticated HTTP requests to port 7474, which returns 401.

- [ ] **Step 1: Fix Docker Compose Neo4j health check**

In `deployment/docker-compose.prod.yml`, line 77, replace the health check with one that includes auth:

```yaml
    healthcheck:
      test: [ "CMD-SHELL", "wget --no-verbose --tries=1 --spider --user=neo4j --password=${NEO4J_PASSWORD:-worldos_secret} http://localhost:7474 || exit 1" ]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 45s
```

- [ ] **Step 2: Fix PHP HealthCheckCommand Neo4j check**

In `backend/app/Modules/Simulation/Console/Commands/HealthCheckCommand.php`, replace the `checkNeo4j()` method (lines 87-116):

```php
private function checkNeo4j(): bool
{
    try {
        $uri = config('worldos_knowledge.neo4j.uri', '');
        if (empty($uri)) {
            $this->line('  Neo4j: not configured (uri is empty)');
            return false;
        }

        $parsed = parse_url(str_replace(['bolt://', 'neo4j://'], 'http://', $uri));
        $host = $parsed['host'] ?? 'localhost';
        $port = 7474;

        $username = config('worldos_knowledge.neo4j.username', 'neo4j');
        $password = config('worldos_knowledge.neo4j.password', '');

        $ch = curl_init("http://{$host}:{$port}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
        if ($username && $password) {
            curl_setopt($ch, CURLOPT_USERPWD, "{$username}:{$password}");
        }
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    } catch (\Throwable $e) {
        $this->line("  Neo4j error: {$e->getMessage()}");
        return false;
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add deployment/docker-compose.prod.yml backend/app/Modules/Simulation/Console/Commands/HealthCheckCommand.php
git commit -m "fix: Neo4j health check now includes auth credentials

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

### Task 3: Run Laravel Pint Linting

**Files:**
- Modify: multiple PHP files (auto-formatted by Pint)

- [ ] **Step 1: Run Pint in dry-run mode to assess scope**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend vendor/bin/pint --test 2>&1 | tail -5
```

Expected: Shows number of files that would change.

- [ ] **Step 2: Run Pint to auto-fix**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend vendor/bin/pint
```

Expected: Files reformatted to PSR-12.

- [ ] **Step 3: Run tests to verify no breakage**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: apply Laravel Pint PSR-12 formatting

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Part B: VAF Phase 1 (Tasks 4-8)

These tasks follow the detailed VAF plan at `docs/superpowers/plans/2026-04-10-vaf-visual-animation-framework.md` (Tasks 1-5).

### Task 4: Animation Script Pydantic Schemas (Narrative-Loom)

**Corresponds to:** VAF Plan Task 1

**Files:**
- Modify: `narrative-loom/schemas.py`
- Modify: `narrative-loom/state.py`

- [ ] **Step 1: Read current schemas.py and state.py to understand existing models**

Read `narrative-loom/schemas.py` and `narrative-loom/state.py` to find insertion points.

- [ ] **Step 2: Add VAF Pydantic models to schemas.py**

After the existing `CriticReview` class, add:
- `VAFBackground(BaseModel)` — type, colors, description
- `VAFAtmosphere(BaseModel)` — filter, intensity, weather
- `VAFCameraMovement(BaseModel)` — type, speed, easing
- `VAFEffect(BaseModel)` — type, intensity, color, trigger_at_ms
- `VAFTransition(BaseModel)` — type, duration_ms
- `VAFScene(BaseModel)` — id, type, duration_ms, background, atmosphere, camera, effects, narration, transition
- `VAFAnimationScript(BaseModel)` — version, total_duration_ms, scenes list

Follow the exact field definitions from the full VAF plan (Task 1, Step 1).

- [ ] **Step 3: Add animation_script to NarrativeState**

In `narrative-loom/state.py`, add `animation_script: Optional[dict] = None` to the NarrativeState TypedDict.

- [ ] **Step 4: Commit**

```bash
git add narrative-loom/schemas.py narrative-loom/state.py
git commit -m "feat(vaf): add AnimationScript Pydantic models to narrative-loom

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

### Task 5: Upgrade VFX Director Agent

**Corresponds to:** VAF Plan Task 2

**Files:**
- Modify: `narrative-loom/agents/vfx_director.py`
- Modify: `narrative-loom/graph_builder.py`
- Modify: `narrative-loom/tests/test_agents.py`

- [ ] **Step 1: Read current vfx_director.py**

Read `narrative-loom/agents/vfx_director.py` to understand current VFX Director implementation.

- [ ] **Step 2: Upgrade VFX Director to produce animation_script**

Modify the VFX Director agent to:
1. Accept the chronicle narrative (from Wordsmith output)
2. Use structured output to generate a `VAFAnimationScript`
3. Store it in `state["animation_script"]`

Follow the full VAF plan Task 2 for exact implementation.

- [ ] **Step 3: Reorder VFX Director in graph_builder.py**

In `narrative-loom/graph_builder.py`, move VFX Director to run AFTER Wordsmith (not before). This ensures it has the final narrative text to work with.

- [ ] **Step 4: Add VFX Director test**

In `narrative-loom/tests/test_agents.py`, add a test that:
1. Creates a mock state with narrative content
2. Runs VFX Director
3. Asserts `animation_script` is present with valid scene structure

- [ ] **Step 5: Commit**

```bash
git add narrative-loom/agents/vfx_director.py narrative-loom/graph_builder.py narrative-loom/tests/test_agents.py
git commit -m "feat(vaf): upgrade VFX Director to produce animation scripts

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

### Task 6: Backend Migration + Model Update

**Corresponds to:** VAF Plan Task 3

**Files:**
- Create: `backend/database/migrations/2026_04_13_100001_add_animation_script_to_chronicles_table.php`
- Modify: `backend/app/Models/Chronicle.php`

- [ ] **Step 1: Read Chronicle model**

Read `backend/app/Models/Chronicle.php` to understand existing fields and casts.

- [ ] **Step 2: Create migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chronicles', function (Blueprint $table) {
            $table->json('animation_script')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('chronicles', function (Blueprint $table) {
            $table->dropColumn('animation_script');
        });
    }
};
```

- [ ] **Step 3: Update Chronicle model**

Add `'animation_script'` to `$fillable` array and `'animation_script' => 'array'` to `$casts`.

- [ ] **Step 4: Run migration in Docker**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan migrate
```

Expected: Migration runs successfully.

- [ ] **Step 5: Commit**

```bash
git add backend/database/migrations/2026_04_13_100001_add_animation_script_to_chronicles_table.php backend/app/Models/Chronicle.php
git commit -m "feat(vaf): add animation_script column to chronicles table

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

### Task 7: Chronicle Detail API Endpoint

**Corresponds to:** VAF Plan Task 4

**Files:**
- Modify: `backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php`
- Modify: `backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php`
- Modify: `backend/app/Modules/WorldOS/routes/api.php`

- [ ] **Step 1: Read existing ChronicleResource, NarrativeController, and routes**

Read all three files to understand current API structure.

- [ ] **Step 2: Update ChronicleResource**

Add `has_animation` flag and conditionally include `animation_script`:

```php
'has_animation' => ! empty($this->animation_script),
'animation_script' => $this->when(
    request()->routeIs('chronicles.show'),
    $this->animation_script
),
```

- [ ] **Step 3: Add show method to NarrativeController**

```php
public function show(Chronicle $chronicle): ChronicleResource
{
    return new ChronicleResource($chronicle);
}
```

- [ ] **Step 4: Add route**

In `routes/api.php`, add:

```php
Route::get('/chronicles/{chronicle}', [NarrativeController::class, 'show'])->name('chronicles.show');
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php \
  backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php \
  backend/app/Modules/WorldOS/routes/api.php
git commit -m "feat(vaf): add chronicle detail endpoint with animation_script

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

### Task 8: Chronicle Animation Feature Test

**Corresponds to:** VAF Plan Task 5

**Files:**
- Create: `backend/tests/Feature/ChronicleAnimationTest.php`

- [ ] **Step 1: Read existing feature tests for patterns**

Read one existing feature test (e.g., `backend/tests/Feature/Simulation/FinanceEngineTest.php`) to match test style and base class.

- [ ] **Step 2: Write the failing test first**

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Chronicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChronicleAnimationTest extends TestCase
{
    use RefreshDatabase;

    public function test_chronicle_list_includes_has_animation_flag(): void
    {
        Chronicle::factory()->create(['animation_script' => null]);
        Chronicle::factory()->create(['animation_script' => ['version' => '1.0', 'scenes' => []]]);

        $response = $this->getJson('/api/chronicles');

        $response->assertOk();
        $response->assertJsonPath('data.0.has_animation', false);
        $response->assertJsonPath('data.1.has_animation', true);
    }

    public function test_chronicle_show_returns_animation_script(): void
    {
        $script = [
            'version' => '1.0',
            'total_duration_ms' => 10000,
            'scenes' => [
                ['id' => 'scene_1', 'type' => 'establishing', 'duration_ms' => 5000],
            ],
        ];

        $chronicle = Chronicle::factory()->create(['animation_script' => $script]);

        $response = $this->getJson("/api/chronicles/{$chronicle->id}");

        $response->assertOk();
        $response->assertJsonPath('data.has_animation', true);
        $response->assertJsonPath('data.animation_script.version', '1.0');
        $response->assertJsonPath('data.animation_script.total_duration_ms', 10000);
    }

    public function test_chronicle_show_without_animation_returns_null_script(): void
    {
        $chronicle = Chronicle::factory()->create(['animation_script' => null]);

        $response = $this->getJson("/api/chronicles/{$chronicle->id}");

        $response->assertOk();
        $response->assertJsonPath('data.has_animation', false);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan test --filter=ChronicleAnimationTest
```

Expected: FAIL (routes/resource not set up yet if running before Task 7 — if running after, should pass).

- [ ] **Step 4: Run test to verify it passes (after Task 7)**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan test --filter=ChronicleAnimationTest
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/Feature/ChronicleAnimationTest.php
git commit -m "test(vaf): add chronicle animation API feature tests

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 9: Update .dev_status.md

**Files:**
- Modify: `.dev_status.md`

- [ ] **Step 1: Update session status**

Update `.dev_status.md` with:
- Current date (2026-04-13)
- Mark completed: root cleanup, Neo4j health fix, Pint linting
- Mark completed: VAF Phase 1 (schemas, VFX Director, migration, API, tests)
- Update outstanding tasks: remove completed items, add VAF Phase 2 (frontend engine + renderers)
- Update context for next session

- [ ] **Step 2: Commit**

```bash
git add .dev_status.md
git commit -m "docs: update dev status for 2026-04-13 session

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Summary

| Part | Tasks | Scope |
|------|-------|-------|
| **A: Cleanup** | Tasks 1-3 | Delete 17 root files, fix Neo4j health check, run Pint linting |
| **B: VAF Phase 1** | Tasks 4-8 | Pydantic schemas, VFX Director upgrade, migration, API endpoint, tests |
| **Housekeeping** | Task 9 | Update .dev_status.md |

**Total: 9 tasks, ~25 steps**

**After this plan:** VAF Phase 2 (frontend VAF Engine — types, parser, timeline, scheduler, renderers, Cinematic Player page) covers Tasks 6-13 of the full VAF plan.
