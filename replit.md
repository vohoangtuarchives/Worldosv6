# WorldOS V6 — Replit Setup

## Overview
WorldOS V6 is a Civilizational Dynamics Engine — a full-stack simulation of how civilizations rise and fall through Pressure → Decision → Cascade mechanics.

## Architecture
- **Frontend**: Next.js 16 (`frontend/`) — Dashboard UI, running on port **5000**
- **Backend**: Laravel 13 / PHP 8.4 (`backend/`) — REST API, running on port **8000**
- **Engine**: Rust workspace (`engine/`) — gRPC simulation engine (optional; stub used when `SIMULATION_ENGINE_GRPC_URL` is unset)

## Running the App
Single command via workflow `bash start.sh`:
1. Starts Laravel backend at `localhost:8000`
2. Starts Next.js frontend at `0.0.0.0:5000` (Replit webview)
3. Next.js proxies all `/api/*` requests to Laravel via `next.config.ts` rewrites

## Database
- Uses Replit's built-in PostgreSQL
- Credentials sourced from env: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- Migrations run with: `cd backend && php artisan migrate --force`
- TimescaleDB migrations are gracefully skipped (extension not available on Replit)

## Key Config Files
- `start.sh` — startup script for the workflow
- `frontend/next.config.ts` — API proxy rewrites + standalone output
- `backend/.env` — Laravel environment (DB, cache, queue)
- `backend/config/cors.php` — CORS settings (allows all origins)

## Environment Notes
- `QUEUE_CONNECTION=database` (Redis not available; fallback to DB)
- `CACHE_STORE=database` (Redis not available; fallback to DB)
- `SESSION_DRIVER=file`
- `SIMULATION_ENGINE_GRPC_URL` — leave empty to use stub engine; set to `http://localhost:50052` for real Rust engine

## Optional Services
- **Rust Engine**: `cd engine && cargo run -p worldos-grpc --bin worldos-engine`
- **OpenAI**: Set `OPENAI_API_KEY` secret for AI narrative generation
- **Demo seed**: `cd backend && php artisan worldos:demo-scenario`
