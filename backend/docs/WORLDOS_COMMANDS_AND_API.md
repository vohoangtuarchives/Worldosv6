# WorldOS: Artisan commands and API (Phase J, M)

Cấu hình qua `.env`: xem các biến trong `.env.example` (nhóm WorldOS: Autonomic, Scheduler, Timeline Selection, Narrative Extraction, Civilization Memory, Mythology, Ideology, Great Person, Pulse). Multi-branch fork: đặt `WORLDOS_MAX_FORK_BRANCHES` (mặc định 1); số nhánh thực tế = min(max_fork_branches, max(1, floor(entropy*4))).

## Artisan commands

| Command | Mô tả |
|--------|--------|
| `php artisan worldos:autonomic-pulse {--ticks=1} {--prune}` | Dispatch advance jobs cho mọi world autonomic (Scheduler + AEE). |
| `php artisan worldos:pulse {--ticks=10}` | Chạy một nhịp pulse (advance + narrative) cho toàn bộ world autonomic. |
| `php artisan worldos:engines {action} [options]` | Gọi engine: timeline-selection, extract-lore, civilization-memory, mythology, ideology, great-person. |

### worldos:engines – options

- **timeline-selection** — Cần `--world=ID` hoặc `--saga=ID`. Tùy chọn `--limit=N`.
- **extract-lore** — Cần `--world=ID` hoặc `--saga=ID`. Tùy chọn `--limit=N`.
- **civilization-memory** — Cần `--universe=ID`.
- **mythology** — Cần `--universe=ID`.
- **ideology** — Cần `--universe=ID`.
- **great-person** — Cần `--universe=ID`. Tùy chọn `--tick=N`.

Ví dụ:

```bash
php artisan worldos:engines timeline-selection --world=1 --limit=5
php artisan worldos:engines extract-lore --world=1 --limit=3
php artisan worldos:engines civilization-memory --universe=1
php artisan worldos:engines mythology --universe=1
php artisan worldos:engines ideology --universe=1
php artisan worldos:engines great-person --universe=1 --tick=100
```

## API (Phase J)

Tất cả route dưới đây nằm trong prefix `worldos`, bảo vệ bởi `auth:sanctum`. Base URL: `/api/worldos/`.

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `worlds/{id}/timelines?limit=10` | Timeline selection cho world. |
| POST | `worlds/{id}/extract-lore` | Extract lore cho world (body/query: `limit`). |
| GET | `sagas/{id}/timelines?limit=10` | Timeline selection cho saga. |
| POST | `sagas/{id}/extract-lore` | Extract lore cho saga (body/query: `limit`). |
| GET | `universes/{id}/civilization-memory?from_tick=&to_tick=` | Civilization memory (from/to tùy chọn). |
| POST | `universes/{id}/mythology` | Sinh mythology chronicle (body/query: from_tick, to_tick tùy chọn). |
| GET | `universes/{id}/ideology` | Dominant ideology. |
| POST | `universes/{id}/great-person?tick=` | Đánh giá + spawn great person (tick tùy chọn). |
| GET | `engines/status` | Health/status: kiểm tra engine bindings và config (ok, engines, config). |

Ví dụ (sau khi đăng nhập, gửi kèm `Authorization: Bearer {token}`):

```bash
curl -s -H "Authorization: Bearer TOKEN" "https://your-api/api/worldos/worlds/1/timelines?limit=5"
curl -s -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"limit":3}' "https://your-api/api/worldos/worlds/1/extract-lore"
curl -s -H "Authorization: Bearer TOKEN" "https://your-api/api/worldos/universes/1/ideology"
curl -s -X POST -H "Authorization: Bearer TOKEN" "https://your-api/api/worldos/universes/1/great-person?tick=100"
```

## Universe archived — Bước tiếp theo

Khi một **universe** chuyển sang trạng thái **archived** (entropy quá cao, AEE/ConvergenceEngine quyết định), nó không còn được **pulse** tự động (Pulse World chỉ advance universe `active`). Bạn có thể:

| Hành động | Cách làm |
|-----------|----------|
| **Fork** | Trên dashboard: bấm **Fork Universe** — tạo universe con từ tick hiện tại; dashboard sẽ chuyển sang universe con (active). Hoặc API: `POST /api/worldos/universes/{id}/fork` (body: `tick` tùy chọn). |
| **Advance thủ công** | Bấm **Tick +1** trên header — universe archived vẫn advance được từng tick nếu cần cập nhật số liệu. |
| **Xem lịch sử** | Tab **Chronicles**, **Biên Niên Sử**, **Dư Âm** — xem timeline và chronicle của vũ trụ này. |
| **Chọn universe khác** | Từ màn hình world / simulation status chọn universe khác (active) trong cùng world; hoặc dùng universe selector bên trái nếu có. |
| **Tạo universe mới (không fork)** | API: `POST /api/worldos/worlds/{id}/spawn` (nếu có) hoặc seed/demo — tạo universe mới trong world, không kế thừa từ universe archived. |

**Lưu ý**: Hiện tại không có API "un-archive" (chuyển `archived` → `active`). Nếu cần tiếp tục chơi từ universe đã archived, dùng **Fork** để tạo nhánh mới từ tick hiện tại.
