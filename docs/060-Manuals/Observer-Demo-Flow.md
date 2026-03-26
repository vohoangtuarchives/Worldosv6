# Observer Demo Flow

Tai lieu nay dung de chay mot vong demo/hand-off nhanh cho Observer Console ma khong can Docker prod.

## 1. Demo data hien co

Database seeders dang co trong `backend/database/seeders`, trong do `DatabaseSeeder.php` da goi cac nhom du lieu nen sau:

- ruleset tiers / definitions / combine rules
- vocation registry
- cosmology
- material / symbolic material / material expansion
- flavor text
- event triggers
- civilization attractors
- world ruleset runtime

Ngoai ra, module Simulation co origin-based seeders trong:

- `backend/app/Modules/Simulation/Services/Seeders/VietnameseHeritageSeeder.php`
- `backend/app/Modules/Simulation/Services/Seeders/SolarSeeder.php`
- `backend/app/Modules/Simulation/Services/Seeders/WesternHeritageSeeder.php`
- `backend/app/Modules/Simulation/Services/Seeders/EasternHeritageSeeder.php`
- `backend/app/Modules/Simulation/Services/Seeders/VoidBornSeeder.php`
- `backend/app/Modules/Simulation/Services/Seeders/PrimevalSeeder.php`

Neu can mot flow demo co nhieu narrative/material hon, uu tien universe thuoc origin `vietnamese` hoac `solar` vi trong repo hien tai hai nhom nay co material + chronicle seed ro nhat.

## 2. Setup toi thieu

Backend:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Can dam bao `frontend/.env.local` co:

```env
BACKEND_URL=http://localhost:8000
```

## 3. Vong demo khuyen nghi

1. Mo `http://localhost:5000/universes`
2. Chon mot universe co du lieu observer de doc duoc
3. Vao tab `Control`
4. Xac nhan thay `Reality Core`, `Mutation Stream`, va cac control mutation
5. Advance simulation 5 ticks
6. Kiem tra toast va panel control tu cap nhat
7. Create snapshot
8. Mo tab `Snapshots` va xac nhan checkpoint moi xuat hien
9. Fork branch tai tick hien tai hoac tick vua quan sat
10. Mo tab `Forks` va xac nhan branch moi + compare panel
11. Mo tab `Timeline` va xac nhan lane interventions hien snapshot/fork
12. Neu co actor, vao `Actors` -> chon actor -> xem `Decision trail`
13. Mo `Chronicles` de doi chieu tick/timeline neu branch co chronicle
14. Mo `/dashboard/ai-config` -> tab `Diagnostics` -> ping mot driver de xem telemetry

## 4. Ket qua mong doi

Sau vong demo tren, can thay duoc:

- observer routes chinh khong can mock data
- mutations cap nhat bang React Query invalidation thay vi `router.refresh()`
- control tab doc duoc reality/autonomy state that
- timeline tach duoc causal ticks / interventions / mutations
- snapshots va forks tu dong xuat hien o panel lien quan
- diagnostics page ping duoc driver va hien telemetry co nghia

## 5. Neu du lieu con qua rong

Neu universes local hien tai qua it du lieu de demo tron vong:

- uu tien tao/chon universe gan voi origin `vietnamese` hoac `solar`
- seed lai database bang `php artisan db:seed --force`
- xoa cache neu can bang `php artisan cache:clear`
- re-open route `control`, `timeline`, `forks`, `snapshots`, `actors`

## 6. Regression checklist nhanh

- [ ] Universes list mo duoc
- [ ] Overview khong doan field
- [ ] Control co `Reality Core` + `Mutation Stream`
- [ ] Advance co toast va panel tu cap nhat
- [ ] Snapshot tao xong xuat hien trong `Snapshots`
- [ ] Fork tao xong xuat hien trong `Forks`
- [ ] Timeline hien du divergence lanes
- [ ] Actor detail mo duoc neu co actor
- [ ] Diagnostics ping duoc it nhat 1 driver