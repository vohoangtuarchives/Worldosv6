# Worldosv6 Frontend-Backend Integration Map

**Generated:** 2026-04-11  
**Scope:** Complete frontend-to-backend API and integration analysis

---

## 1. AXIOS CLIENT SETUP

**File:** `frontend/src/lib/api.ts`

### Configuration
- **Base URL:** `process.env.NEXT_PUBLIC_API_URL || '/api'`
- **Headers:** `application/json`, `Accept: application/json`
- **HTTP Client:** Axios

### Interceptors
- **Response Interceptor:** Auto-unwraps Laravel resource wrapper `{ data: <payload> }`
- **Error Handler:** Toast notifications for connection errors

---

## 2. FRONTEND FEATURES STRUCTURE

**Directory:** `frontend/src/features/`

Seven feature modules with API and hook layers:
- **Actors** - Actor management
- **Simulation** - Universe simulation control
- **Wavefunction** - Wave function analysis
- **Causal Map** - Causal topology and links
- **Multiverse** - Multiverse bloom/resonance
- **Intelligence** - AI logs and settings
- **Universe** - Universe list and metrics

