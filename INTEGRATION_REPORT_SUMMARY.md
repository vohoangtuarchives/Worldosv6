# WorldOS v6 - Integration Report
**Date:** April 11, 2026

---

## 1. NarrativeLoomService.php Summary

**File:** `backend/app/Modules/Narrative/Services/NarrativeLoomService.php`

### Configuration
- **Base URL:** `http://narrative_loom:8001`
- **Timeout:** 600s for weave, 30s for actor-intent
- **Runtime:** AiGateway (OpenAI, Anthropic, local models)

### Methods
1. **weave()** - POST `/weave-chronicles`
   - Input: world_id, era, genre, power_system, whispers (top 3 high-virality)
   - Output: { final_prose, summary, metadata }
   
2. **getActorIntent()** - POST `/actor-intent`
   - Input: actor_id, actor context, ai_runtime
   - Output: { action, confidence, ... }

### Integration
- Uses AiGateway for runtime selection
- Reports usage to ReportKeyUsageAction
- HTTP client with error handling

---

## 2. Knowledge Module Routes

**File:** `backend/app/Modules/Knowledge/routes/api.php`

All routes PUBLIC under `/api/wiki`:

- GET `/wiki/{universeId}/search?q=` - Multi-source search
- GET `/wiki/{universeId}/actor/{actorId}` - Actor with parallel versions
- GET `/wiki/{universeId}/axiom/{axiomId}` - Axiom with drift logs
- GET `/wiki/axioms` - All axioms
- GET `/wiki/resolve-identity/{actorId}` - Parallel identities

---

## 3. Wiki Controllers & Services

**WikiEngineService Features:**
- Multi-source search (Actors, Chronicles, Axioms) with 5-result limits
- Axiom drift tracking from UniverseSnapshot.state_vector
- Auto-linking biography text (str_replace, no word boundaries)
- Parallel identity resolution (name + identity_hash matching)

---

## 4. Frontend Chronicles Hooks

**File:** `frontend/src/hooks/useChronicles.ts`

Three hooks, all polling at 15-second intervals:
- `useChronicles()` - GET /worldos/universes/{id}/chronicles
- `useMythScars()` - GET /worldos/universes/{id}/myth-scars
- `useArtifacts()` - GET /worldos/universes/{id}/artifacts

**Polling Setup:** refetchInterval: 15000, refetchOnWindowFocus: true

---

## 5. Frontend Simulation Hooks

**File:** `frontend/src/features/simulation/hooks/index.ts`

Query Hooks:
- useSnapshots()
- useForks()

Mutation Hooks (9 total):
- useCreateSnapshot(), useForkUniverse(), useCompareBranch()
- useAdvanceSimulation(), useToggleUniverse()
- useCreateUniverse(), useDeleteUniverse()

---

## 6. Frontend Universe Hooks

**File:** `frontend/src/features/universe/hooks/index.ts`

- useUniverseOptions() - List all universes
- useUniverseMetrics() - Metrics for active universe
- useUniverseDossier() - Full dossier for active universe

All support manual mutate() for cache invalidation.

---

## 7. WorldOS API Routes

**File:** `backend/app/Modules/WorldOS/routes/api.php`

Total: 50+ routes across:
- Universe Management (GET list, create, update, delete)
- Narrative & Chronicles (GET + POST generate)
- Actors & Intelligence (GET + POST mind-meld)
- Simulation Control (advance, fork, toggle, snapshots)
- Knowledge Wiki (5 routes)

Key Routes:
- POST `/worldos/universes/{id}/generate-chronicle` - Trigger weaving
- POST `/worldos/actors/{id}/mind-meld` - Trigger actor intelligence
- POST `/worldos/simulation/advance` - Advance simulation ticks

---

## 8. Frontend Simulation Controls Hook

**File:** `frontend/src/hooks/useSimulationControls.ts`

Duplicates most hooks from features/simulation/hooks/index.ts
- useSnapshots() & useForks(): 15-second polling
- 8 other mutation hooks for simulation control

---

## Key Integration Flows

### Narrative Generation
```
Frontend useChronicles (15s polling)
  → GET /worldos/universes/{id}/chronicles
  → [OR] POST /worldos/universes/{id}/generate-chronicle
  → TimelineController::generateChronicle()
  → NarrativeLoomService::weave()
  → POST http://narrative_loom:8001/weave-chronicles
  → Python Loom (AI generation)
  → Returns final_prose
  → Stored in Chronicle model
  → Frontend refresh via polling
```

### Actor Intelligence
```
POST /worldos/actors/{id}/mind-meld
  → ActorController::mindMeld()
  → NarrativeLoomService::getActorIntent()
  → POST http://narrative_loom:8001/actor-intent
  → Python Loom (AI decision)
  → Returns { action, confidence, ... }
```

### Wiki Knowledge
```
GET /api/wiki/{universeId}/search?q=...
  → WikiController::search()
  → WikiEngineService::search()
  → Multi-source search (Actors, Chronicles, Axioms)
```

---

## Issues Detected

1. **No Adaptive Polling** ⚠️ MEDIUM-HIGH
   - All hooks use fixed 15-second intervals
   - Could drain battery on mobile
   - Recommendation: Implement exponential backoff (15s → 60s when idle)

2. **No HTTP Caching Headers** ⚠️ MEDIUM
   - Every 15s poll fetches full dataset
   - Recommendation: Add Cache-Control, ETag, Last-Modified

3. **Naive Auto-linking** ⚠️ LOW-MEDIUM
   - str_replace() without word boundaries
   - Could create broken links for similar names
   - Recommendation: Use regex or markdown parser

4. **Hard-coded Whispers Filter** ⚠️ LOW
   - virality > 0.7 threshold not configurable
   - Recommendation: Make configurable or use impact_score

5. **No Semantic Similarity** ⚠️ LOW
   - Only exact name/identity_hash matching for parallel identities
   - Hardcoded similarity_score: 1.0
   - Recommendation: Add ML-based similarity scoring

6. **No Error Recovery** ⚠️ MEDIUM-HIGH
   - If Python Loom down, no retry/circuit-breaker
   - Recommendation: Add exponential backoff + circuit breaker

7. **No Real-time Updates** ⚠️ MEDIUM
   - All via polling, WebSocket token route unused
   - Recommendation: Migrate to Centrifugo WebSocket channels

---

## Polling Statistics

**Currently Polled Endpoints (all 15-second intervals):**
1. GET /worldos/universes/{id}/chronicles
2. GET /worldos/universes/{id}/myth-scars
3. GET /worldos/universes/{id}/artifacts
4. GET /worldos/universes/{id}/snapshots
5. GET /worldos/universes/{id}/forks

---

## Missing Verification Points

- [ ] TimelineController::generateChronicle() implementation
- [ ] ActorController::mindMeld() integration with getActorIntent()
- [ ] Query definitions (simulationQueries, universeQueries)
- [ ] Python Loom microservice actual signatures
- [ ] Database schema (Chronicle, MythScar, Artifact)
- [ ] Centrifugo WebSocket configuration
- [ ] NarrativeController implementation

---

**Report Generated:** 2026-04-11  
**Files Analyzed:** 8  
**Routes:** 50+  
**Hooks:** 25+  
**Major Issues:** 7

