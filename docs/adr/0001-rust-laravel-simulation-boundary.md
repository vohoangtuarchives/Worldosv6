# ADR 0001: Ranh giới Rust vs Laravel trong simulation

## Status

Accepted.

## Context

WorldOS có hai phần chạy simulation: **Rust kernel** (engine/worldos-core, gRPC) và **Laravel** (backend PHP) với engine pipeline (Geography, Climate, Agriculture, …). Nếu không phân vai rõ ràng:

- Cùng một quy tắc (vd. population growth, pressure) có thể bị implement ở cả hai nơi với công thức khác nhau → **logic drift**.
- Simulation không còn deterministic (cùng seed + state → khác output).
- Dev dễ nhét logic nặng vào Laravel (container resolve, event dispatch tốn kém) → bottleneck khi scale (10k zones, 100k agents).

Doc [21 Field-Based Simulation Architecture](../system/21-field-simulation-architecture-and-roadmap.md) §5, §7 mô tả vấn đề và bảng phân vai.

## Decision

**Rust** là nơi duy nhất thực thi **deterministic world physics**: world state, physics, diffusion, cascade, deterministic update. Mọi thay đổi state theo quy tắc vật lý (pressure, entropy, phase transition) phải sống trong Rust kernel; seed + state input → output xác định.

**Laravel** chỉ đảm nhiệm: scenario, AI, story, persistence, analytics, UI. Laravel không duplicate hoặc override công thức growth, pressure, cascade; không thêm rule deterministic mới vào PHP engine pipeline nếu rule đó ảnh hưởng trực tiếp đến state mà Rust đã tính.

**Quy tắc**:

- **Single source of truth**: Quy tắc vật lý / state transition deterministic sống ở **một nơi** (Rust hoặc Laravel). Hiện tại chọn Rust cho physics/diffusion/cascade.
- Config `simulation_tick_driver`: `rust_only` (mặc định) — tick chạy hoàn toàn trên Rust; Laravel chỉ đồng bộ snapshot, lưu, fire event, chạy listener. Khi `laravel_kernel` bật thì Laravel kernel chạy thêm sau Rust; khi đó cần đảm bảo không duplicate logic đã có trong Rust (xem [16 Simulation Kernel & Potential Field](../system/16-simulation-kernel-and-potential-field.md)).

**Bảng trách nhiệm**:

| Rust | Laravel |
|------|---------|
| world state | scenario |
| physics | AI |
| diffusion | story |
| cascade | persistence |
| deterministic update | analytics |
| | UI |

## Consequences

- **Lợi ích**: Tránh logic drift; replay và determinism có thể tin được; ranh giới rõ giúp scale (Rust = heavy simulation, Laravel = orchestration).
- **Trade-off**: Mọi thay đổi công thức physics/pressure/cascade phải làm trong Rust và release engine; Laravel không thể “nhanh sửa” rule vật lý mà không đụng Rust.

**Checklist khi thêm logic mới**: Logic mới thuộc **Rust** (deterministic, ảnh hưởng state vật lý) hay **Laravel** (orchestration, narrative, persistence)? Nếu là deterministic state transition → Rust.
