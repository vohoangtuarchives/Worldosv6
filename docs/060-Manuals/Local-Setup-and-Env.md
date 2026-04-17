# Local Setup and Env

Tai lieu nay mo ta cach chay local cho phan backend + frontend dang duoc observer su dung. Khong yeu cau Docker prod.

## 1. Yeu cau

- PHP 8.3+
- Composer
- Node.js / npm
- PostgreSQL
- Redis

Tuy chon:

- Centrifugo neu can realtime
- Neo4j neu can graph flow
- Rust engine / gRPC bridge neu muon chay simulation engine that

## 2. Backend setup

Thu muc:

- `backend/`

Lenh co ban:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

Neu can queue/log console:

```bash
php artisan queue:listen --tries=1 --timeout=0
php artisan pail --timeout=0
```

## 3. Frontend setup

Thu muc:

- `frontend/`

Lenh co ban:

```bash
cd frontend
npm install
npm run dev
```

Frontend mac dinh:

- chay port `5000`

Backend URL dung cho rewrite va server fetch:

- `BACKEND_URL=http://localhost:8000`

Neu can, tao file `frontend/.env.local`:

```bash
BACKEND_URL=http://localhost:8000
```

## 4. Bien moi truong quan trong

### Backend `.env`

Can kiem tra toi thieu:

```env
APP_URL=http://localhost
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=worldos
DB_USERNAME=worldos
DB_PASSWORD=secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QUEUE_CONNECTION=redis
CACHE_STORE=redis
FILESYSTEM_DISK=local
```

Autopoiesis:

```env
WORLDOS_AUTOPOIESIS_ENABLED=true
WORLDOS_AUTOPOIESIS_TICK_INTERVAL=100
WORLDOS_AUTOPOIESIS_ENTROPY_THRESHOLD=0.70
```

Narrative / AI:

```env
NARRATIVE_LLM_URL=http://host.docker.internal:1234/v1/chat/completions
NARRATIVE_LLM_KEY=
```

Optional graph / realtime:

```env
WORLDOS_GRAPH_ENABLED=true
WORLDOS_GRAPH_URI=http://localhost:7474

CENTRIFUGO_URL=http://centrifugo:8000
CENTRIFUGO_KEY=api_key
CENTRIFUGO_SECRET=worldos_centrifugo_hmac_secret_key_32bytes_min
CENTRIFUGO_HMAC_SECRET=hmac_secret
```

### Frontend `.env.local`

```env
BACKEND_URL=http://localhost:8000
```

## 5. Demo data va seed

Backend seeders hien co trong:

- `backend/database/seeders/*`
- `backend/app/Modules/Simulation/Services/Seeders/*`

`DatabaseSeeder.php` da seed bo ruleset/material/flavor/event/runtime can thiet cho observer flow. Neu can universe co chat lieu narrative ro hon, uu tien origin `vietnamese` hoac `solar` vi repo hien tai co origin seeder ro nhat cho hai nhom nay.

## 6. Kiem tra local nhanh

Sau khi backend va frontend len:

- mo `http://localhost:5000/universes`
- chon mot universe
- di qua cac tab:
- overview
- control
- actors
- timeline
- chronicles
- snapshots
- forks
- axioms

Can thay:

- route load bang du lieu that
- mutation control co toast
- tab control co `Reality Core` va `Mutation Stream`
- timeline co divergence lanes
- trang `/dashboard/ai-config` co tab `Diagnostics`

Neu can mot script manual ro hon, xem them `docs/060-Manuals/Observer-Demo-Flow.md`.

## 7. Luu y hien tai

- Neu backend thieu `vendor/`, cac lenh artisan/test se khong chay duoc.
- Observer UI khong can Docker prod de verify contract.
- `storage/app/local/simulation/mutated_rules` la noi kiem tra mutation DSL da duoc persist hay chua.