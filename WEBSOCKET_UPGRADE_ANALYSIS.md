# WorldOS V6 WebSocket Upgrade Analysis

## Current Polling Setup

### Polling Intervals (15 seconds)
- **File:** `frontend/src/features/simulation/api/queries.ts`
  - `snapshots(id)`: refetchInterval: 15_000ms
  - `forks(id)`: refetchInterval: 15_000ms
  
- **File:** `frontend/src/features/universe/api/queries.ts`
  - `list()`: refetchInterval: 15_000ms
  - `metrics(id)`: refetchInterval: 10_000ms
  - `dossier(id)`: refetchInterval: 10_000ms

### Polled Endpoints
```
GET /worldos/universes                    [15s]  ← UniverseController@index()
GET /worldos/universes/{id}/metrics       [10s]  ← UniverseController@metrics()
GET /worldos/universes/{id}/dossier       [10s]  ← UniverseController@dossier()
GET /worldos/universes/{id}/snapshots     [15s]  ← UniverseController@snapshots()
GET /worldos/universes/{id}/forks         [15s]  ← UniverseController@forks()
```

### Dashboard Components
- `SnapshotPanel` → uses `useSnapshots()` (15s)
- `ForkPanel` → uses `useForks()` (15s)
- `UniverseStatusPanel` → uses `useUniverseMetrics()` (10s)
- `TickAdvancePanel` → mutation that invalidates `['universes']`

---

## Centrifugo Setup Status

### Frontend Client
**File:** `frontend/src/lib/centrifugo.ts`
```typescript
export function createCentrifuge(): Centrifuge {
    return new Centrifuge(CENTRIFUGO_URL, {});
}
```
- ✅ Client library available
- ✅ URL configurable
- ⚠️ No auth config
- ⚠️ Only used in narrative-studio (not dashboard)

### Backend Configuration
**File:** `backend/config/centrifugo.php`
- ✅ All keys configured (url, api_key, secret, hmac_secret)

**File:** `backend/config/broadcasting.php`
- ❌ BROADCAST_DRIVER='null' (DISABLED!)
- ✅ 'centrifugo' driver configured

**File:** `backend/app/Broadcasting/CentrifugoBroadcaster.php`
- ✅ Fully implemented
- generateToken() → JWT for auth
- broadcast() → HTTP batch publish to Centrifugo

---

## Backend Broadcasting Infrastructure

### Events Defined
1. **UniversePulsed** (`backend/app/Modules/Simulation/Events/UniversePulsed.php`)
   - Channels: `universes.{id}`, `worlds.{id}`
   - Payload: universe_id, tick, entropy, stability_index, metrics

2. **UniverseSimulationPulsed** (`backend/app/Modules/Simulation/Events/UniverseSimulationPulsed.php`)
   - Channel: `public:universes`
   - Event: 'pulsed'
   - Only broadcasts if snapshot exists

### Where Events Fire
**File:** `backend/app/Modules/Simulation/Core/Supervisor/SimulationSupervisor.php` (line 119)
```php
$this->eventDispatcher->dispatchPulsed($universe, $snapshotEntity, $engineResponse, 1, $tickDurationMsPerTick);
```
- Called on EVERY TICK during simulation advance
- Real-time broadcasting ready!

### Dispatch Handler
**File:** `backend/app/Modules/Simulation/Core/Supervisor/EventDispatcher.php`
```php
event(new UniverseSimulationPulsed($universeModel, $snapshotModel, ...));
```
- ✅ Ready to broadcast
- Only fires if BROADCAST_DRIVER != 'null'

---

## API Endpoints Summary

| Endpoint | Method | Auth | Broadcasts | Polled |
|----------|--------|------|-----------|--------|
| /worldos/simulation/advance | POST | ✅ | ✅ UniverseSimulationPulsed | ❌ |
| /worldos/universes/{id}/toggle-status | POST | ✅ | ❌ | ❌ |
| /worldos/universes/{id}/snapshots | POST | ✅ | ❌ | ❌ |
| /worldos/universes/{id}/fork | POST | ✅ | ❌ | ❌ |
| /worldos/universes/{id} | DELETE | ✅ | ❌ | ❌ |
| /worldos/universes | GET | ❌ | ❌ | ✅ (15s) |
| /worldos/universes/{id}/metrics | GET | ❌ | ❌ | ✅ (10s) |
| /worldos/universes/{id}/dossier | GET | ❌ | ❌ | ✅ (10s) |
| /worldos/universes/{id}/snapshots | GET | ❌ | ❌ | ✅ (15s) |
| /worldos/universes/{id}/forks | GET | ❌ | ❌ | ✅ (15s) |

---

## Migration Path: Polling → WebSocket

### Phase 1: Enable Broadcasting (1 day)
- [ ] Set `BROADCAST_DRIVER=centrifugo` in .env
- [ ] Verify Centrifugo running
- [ ] Test by advancing simulation
- [ ] Watch Centrifugo logs for publish events

### Phase 2: Frontend Auth (2 days)
- [ ] Create `POST /api/centrifugo/token` endpoint
- [ ] Update `lib/centrifugo.ts` to request token
- [ ] Connect with JWT auth
- [ ] Verify connection in dev tools

### Phase 3: WebSocket Hooks (3 days)
- [ ] Create `useCentrifugoConnection()` hook
- [ ] Create `useCentrifugoSubscription()` hook
- [ ] Create `useCentrifugoRealtimeQuery()` hook
- [ ] Test with narrative-studio as reference

### Phase 4: Replace Polling (5 days)
**Priority order (by poll frequency & impact):**
1. Snapshots (15s → WebSocket) 
2. Forks (15s → WebSocket)
3. Metrics (10s → WebSocket)
4. Universe list (15s → WebSocket)
5. Dossier (10s → WebSocket)

### Phase 5: Add New Broadcasts (3 days)
- [ ] Dispatch `UniverseStatusChanged` on toggle
- [ ] Dispatch `UniverseSnapshotCreated` on snapshot create
- [ ] Dispatch `UniverseForkCreated` on fork
- [ ] Dispatch `UniverseDeleted` on delete

### Phase 6: Graceful Degradation (2 days)
- [ ] Fallback to polling if WebSocket down
- [ ] Connection status UI indicator
- [ ] Auto-reconnect with exponential backoff
- [ ] Error logging & monitoring

---

## Key Files to Modify

### Backend
- `backend/config/broadcasting.php` ← Enable BROADCAST_DRIVER
- `backend/app/Modules/WorldOS/routes/api.php` ← Add token endpoint
- `backend/app/Modules/WorldOS/Http/Controllers/UniverseController.php` ← Dispatch on mutations

### Frontend
- `frontend/src/lib/centrifugo.ts` ← Add auth
- `frontend/src/hooks/useCentrifugo*.ts` ← Create WebSocket hooks (NEW)
- `frontend/src/features/simulation/api/queries.ts` ← Use WebSocket
- `frontend/src/features/universe/api/queries.ts` ← Use WebSocket

---

## Required Environment Variables

### Backend (.env)
```
BROADCAST_DRIVER=centrifugo
CENTRIFUGO_URL=http://localhost:8000
CENTRIFUGO_KEY=<api-key>
CENTRIFUGO_SECRET=<secret>
CENTRIFUGO_HMAC_SECRET=<hmac-secret>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_CENTRIFUGO_URL=ws://localhost/connection/websocket
```

---

## Quick Start: Verify Broadcasting Today

```bash
# 1. Start Centrifugo
docker run -p 8000:8000 centrifugo/centrifugo:latest

# 2. Set env
export BROADCAST_DRIVER=centrifugo
export CENTRIFUGO_URL=http://localhost:8000
export CENTRIFUGO_KEY=default_key
export CENTRIFUGO_SECRET=default_secret

# 3. Trigger advance in dashboard

# 4. Watch logs
docker logs -f <container>

# 5. Subscribe on frontend console
const c = new Centrifuge('ws://localhost/connection/websocket');
const s = c.newSubscription('public:universes');
s.on('message', (m) => console.log(m.data));
s.subscribe();
```

---

## Implementation Notes

### Current (HTTP Polling)
- ~600ms per poll cycle per universe (6 endpoints × 100ms)
- 24-36 requests/minute per universe
- For 10 universes: 240-360 req/min

### With WebSocket
- ~50ms initial connection
- 0 requests (event-driven)
- Real-time delivery (< 100ms)

### Expected Savings
- 90-95% reduction in API requests
- 10-15 second latency reduction
- Massive server load reduction

