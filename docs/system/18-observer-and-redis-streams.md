# 18 — Observer & Redis Streams (V6)

Tài liệu mô tả **ObserverService** (publish event vào Redis Streams) và cách frontend **consume** stream qua API và hook `useObserver`.

## 18.1 ObserverService (Backend)

- **Vị trí**: `App\Services\Observer\ObserverService`
- **Stream key**: `universe:events` (global) hoặc `universe:events:{multiverse_id}` (theo multiverse).
- **Publish**:
  - `publishSnapshot($universeId, $multiverseId, $tick, $payload)` — ghi event `snapshot` với universe_id, tick, at (ISO8601).
  - `publishEvent($universeId, $multiverseId, $eventType, $payload)` — ghi event tùy ý.
- **Lưu ý**: Payload được flatten (scalar giữ nguyên, array/object → json_encode) và ghi bằng `Redis::xAdd($key, '*', $flat, 10000)` (maxlen 10000).

### Consumer: readStream

- `readStream(?int $multiverseId, string $lastId = '0', int $count = 50): array`
- Trả về mảng `[{ "id" => stream_id, "data" => [key => value, ...] }, ...]`.
- Dùng `Redis::xRead([$streamKey => $lastId], $count, 0)` (non-blocking). Frontend gọi API với `last_id` sau mỗi lần đọc để lấy batch tiếp theo.

## 18.2 API Observer Stream

- **Route**: `GET /worldos/observer/stream` (trong group `auth:sanctum`, prefix `worldos`).
- **Query**:
  - `last_id`: ID entry cuối đã đọc (mặc định `0`).
  - `multiverse_id`: (tùy chọn) scope stream theo multiverse.
  - `count`: số entry tối đa (1–100, mặc định 50).
- **Response**: `{ "entries": [ { "id": "...", "data": { ... } }, ... ] }`

Ví dụ:

```http
GET /api/worldos/observer/stream?last_id=0&count=20
```

## 18.3 Frontend: useObserver

- **Vị trí**: `frontend/src/hooks/useObserver.ts`
- **API client**: `api.observerStream({ lastId?, multiverseId?, count? })` trong `frontend/src/lib/api.ts`.

### Hook API

```ts
const { entries, lastId, error, poll } = useObserver({
  intervalMs: 2000,   // Poll mỗi 2s; 0 = tắt
  multiverseId: null, // null = stream global
  count: 50,
});
```

- **entries**: Mảng entry đã nhận (tích lũy qua các lần poll).
- **lastId**: ID cuối dùng cho request tiếp theo.
- **error**: Lỗi khi gọi API (nếu có).
- **poll**: Hàm gọi thủ công một lần (không đợi interval).

Dùng khi dashboard cần cập nhật realtime theo event snapshot/event từ simulation mà không reload trang.

## 18.4 TimescaleDB (tùy chọn)

- **Migration**: `database/migrations/2025_02_26_400000_timescaledb_hypertable_universe_snapshots.php`
- Chỉ chạy khi PostgreSQL đã cài **TimescaleDB**. Migration tạo extension và chuyển bảng `universe_snapshots` thành hypertable theo cột `tick`.
- Nếu extension chưa có, migration bỏ qua (try/catch). Có thể chạy tay sau khi cài TimescaleDB.

Chi tiết cài đặt: [15 TimescaleDB Setup](15-timescaledb-setup.md).

---

Xem thêm: [07 API Reference](07-api-reference.md).
