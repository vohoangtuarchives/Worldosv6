# Kế hoạch Hoàn thiện Hệ thống WorldOS

Dựa trên các tài liệu thiết kế và tình trạng hiện tại, kế hoạch hoàn thiện toàn bộ hệ thống WorldOS được chia thành 3 Phase (Giai đoạn) chính. Kế hoạch này giúp đảm bảo sự phát triển ổn định, từ những vá lỗi kiến trúc nền tảng cho đến mở rộng quy mô đa vũ trụ.

## User Review Required
> [!IMPORTANT]
> Đây là bản tổng hợp kế hoạch Master Plan dựa trên các tài liệu đã có. Xin vui lòng kiểm tra xem trình tự ưu tiên đã phù hợp chưa, hay bạn muốn ưu tiên làm Module nào trước (Ví dụ: UX Frontend, API Simulation Status, hay là Backend/Rust logic như fix Fork, Memory index)? 

---

## Proposed Changes

### Phase 1: Nền tảng, Tích hợp & UX (Ngắn hạn)
Giai đoạn này tập trung dọn dẹp kỹ thuật, sửa các logic rủi ro cao và đưa giao diện về một quy chuẩn thống nhất phục vụ việc theo dõi mô phỏng tốt hơn.

#### 1. Backend & Lõi Rust Kernel
- **Sửa cơ chế tự fork Universe (Rev 2):** Sử dụng `BranchEventRepository` để đảm bảo idempotent fork, ngăn chặn các vòng lặp sinh fork vô hạn. Tách logic khởi tạo Saga khỏi các listener event.
- **Tích hợp Memory vào Rust advance:** Đưa `ZoneActorIndex` (đã có trong source) vào sử dụng thực tế khi quét danh sách các actor trên mỗi zone để tối ưu hóa performance phân cực vi mô (Micro mode).
- **Adaptive Scheduler:** Triển khai cơ chế lập lịch linh hoạt, tần suất tick của từng engine thay đổi theo tín hiệu hệ thống (ví dụ: `war_activity` lên cao thì WarEngine chạy thường xuyên hơn).

#### 2. Frontend & Giao diện Theo dõi
- **Refactor Frontend - Unified UX:** Chuẩn hóa Design System bằng cách sử dụng chung một cơ chế CSS variables (tokens). Loại bỏ hardcode `slate` ở các nhánh Dashboard, Materials. Xóa bỏ sự trùng lặp ở Navigation.
- **Dashboard Simulation Monitor:** 
  - Xây dựng API mới: Endpoint `GET worlds/{id}/simulation-status` trả về toàn bộ pipeline state, cấu hình autonomic (`fork_entropy_min`, `archive_entropy_threshold`), và danh sách universes (kèm snapshots).
  - Tích hợp giao diện quản lý đa vũ trụ: Pulse, xem 7 tầng sinh thái, đánh giá timeline score.

#### 3. Tài liệu kiến trúc
- Cập nhật tài liệu chuyên sâu cho tầng **Simulation Intelligence Layer**.

---

### Phase 2: Động cơ Mô phỏng Mở rộng & Quan sát (Trung hạn)
Hoàn thành các engine sinh thái cốt lõi và tích hợp công cụ vận hành.

- **Ecological Collapse Engine:** Đo lường ecosystem metrics (biodiversity, resource_stress) và đánh giá `instability_score`; để từ đó tạo ra sự kiện Collapse (ví dụ: nạn đói đại dịch do cạn kiệt tài nguyên).
- **Ecological Phase Transition Engine:** Chuyển pha sinh thái dựa vào climate và trạng thái hệ sinh thái (ví dụ: Biome shift từ Rừng sang Thảo nguyên).
- **Hệ thống Observability (Jaeger / OTLP):** Tích hợp phân tích vết (Tracing) xuyên suốt từ Laravel xuống Rust để theo sát duration của từng tick pipeline, duration của event routing.

---

---

### Phase 3: Actor Behavior & Cultural Evolution (Current)
Đưa WorldOS lên cấu trúc "The Core-Simulation Divergence", di chuyển cơ chế đánh giá hành vi và văn hóa xuống Rust Engine để tối ưu hiệu năng và tính quy luật.

#### 1. Data-Driven Behavior Graph (Micro Layer)
- [MODIFY] [engine/worldos-core/src/types.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs): Bổ sung [BehaviorGraph](file:///c:/projects/IPFactory/engine/worldos-core/src/behavior_graph.rs#79-83) vào [WorldConfig](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#7-21).
- [MODIFY] [engine/worldos-core/src/behavior_graph.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/behavior_graph.rs): 
    - Loại bỏ logic hardcode trong `tests`.
    - Cập nhật [BehaviorGraphEngine](file:///c:/projects/IPFactory/engine/worldos-core/src/behavior_graph.rs#79-83) để nạp nodes từ [WorldConfig](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#7-21).
    - Tích hợp Rayon cho Parallel Processing (1M actors).

#### 2. Pattern-based Meso Layer (Mass Behavior)
- [MODIFY] [engine/worldos-core/src/mass_behavior.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/mass_behavior.rs):
    - Refactor [apply_dynamics](file:///c:/projects/IPFactory/engine/worldos-core/src/mass_behavior.rs#53-83) để sử dụng [CrowdRule](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#426-432) (định nghĩa trong [BehaviorContext](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#417-424)).
    - Quy tắc ví dụ: `If Crowd(Anger) > 0.6 -> Push Actors to Node "Riot"`.

#### 3. Social & Belief Dynamics
- [MODIFY] [engine/worldos-core/src/social_layers.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/social_layers.rs):
    - Refactor [BeliefSystemEngine](file:///c:/projects/IPFactory/engine/worldos-core/src/social_layers.rs#5-8) và [PowerStructureEngine](file:///c:/projects/IPFactory/engine/worldos-core/src/social_layers.rs#46-49) để sử dụng bộ quy tắc truyền dẫn (Transmission Rules).
    - Hệ thống Coercion dựa trên `HierarchyScore`.

#### 4. Culture Engine (New Module)
- [NEW] [engine/worldos-core/src/culture_engine.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/culture_engine.rs):
    - Hiện thực logic `Meme Propagation`.
    - Tần suất lây lan memes phụ thuộc vào `collective_trust` của zone và `innovation_openness`.
    - Mutation của memes dựa trên `entropy` cục bộ.

#### 5. Integration & Scaling
- [MODIFY] [engine/worldos-core/src/universe.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/universe.rs):
    - Khởi tạo các engine với dữ liệu thực từ [WorldConfig](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#7-21).
    - Đảm bảo pipeline chạy đúng thứ tự: Macro -> Collective -> Meso -> Micro.

---

### Phase 4: Sharding & Distributed Prototype (Current)
Xây dựng mô hình phân tán cho kernel để hỗ trợ hàng triệu actor thông qua cơ chế chia tải (Sharding) và vùng đệm đồng bộ (Ghost Zones).

#### 1. Core Sharding Architecture (Rust)
- [NEW] [engine/worldos-core/src/sharding.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/sharding.rs):
    - Định nghĩa `ShardId` và [ShardMap](file:///c:/projects/IPFactory/engine/worldos-core/src/sharding.rs#9-12) (Mapping Zone -> Shard).
    - Định nghĩa [GhostZone](file:///c:/projects/IPFactory/engine/worldos-core/src/sharding.rs#15-20): Bản sao chỉ đọc của các zone lân cận thuộc shard khác.
- [MODIFY] [engine/worldos-core/src/types.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs):
    - Bổ sung `sharding_config` vào [WorldConfig](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#7-21).
    - Cập nhật [UniverseState](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#23-59) để giữ danh sách `ghost_zones`.

#### 2. Ghost Zone Synchronization
- [MODIFY] [engine/worldos-core/src/universe.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/universe.rs):
    - Refactor logic `Diffusion` (§Phase 3): Nếu neighbor không nằm trong local shard, engine sẽ tìm kiếm dữ liệu trong `ghost_zones`.
    - Implement `UniverseState::apply_ghost_update`: Cập nhật trạng thái các ghost zones từ dữ liệu bên ngoài.

#### 3. Advanced Trace Analysis & Monitoring
- [MODIFY] [engine/worldos-core/src/lib.rs](file:///c:/projects/IPFactory/engine/worldos-core/src/lib.rs) (hoặc module tracing):
    - Tích hợp `shard_id` vào OTLP spans.
    - Đo lường `sync_latency` - thời gian chờ đợi dữ liệu từ ghost zones.

#### 4. Distributed Prototype (Verification)
- Xây dựng unit test mô phỏng 2 shards chạy song song, trao đổi ghost zones để hoàn tất quá trình khuếch tán (diffusion) mà không làm mất tính nhất quán.

---

## Verification Plan
Đối với giai đoạn 1 (Phase 1), đây là kế hoạch xác minh chung:
1. **Kiểm tra tự động (Unit/Feature Tests):**
   - Chạy lệnh test trên container Backend với command: `docker compose exec backend php artisan test` với các Test case mô phỏng action `ForkUniverseAction`, và check behavior của `DecisionEngine` theo cấu trúc đảm bảo logic rẽ nhánh.
   - Run Frontend check: `npm run check`.
   - Rust kernel: Verify build bằng `cargo test` để đảm bảo code logic của `ZoneActorIndex` được truyền vào thành công. 
2. **Kiểm tra thủ công bằng mắt (Manual Verification):**
   - Truy cập vào Giao diện người dùng ở `localhost:3000`.
   - Kiểm tra Console/Network: Mọi page (Dashboard, Timeline, Material) phải hiển thị cùng 1 design system, layout thống nhất.
   - Thử chức năng Pulse Worlds trên tab Simulation Monitor và xem mạng trả về (200 OK) API có kết cấu snapshot chuẩn theo tài liệu.

---

### Phase 6: High-Fidelity Historical Reconstruction (Current)
Giai đoạn này tập trung vào việc lưu trữ và phân tích chuỗi nhân quả sâu, cho phép tái hiện lịch sử mô phỏng với độ phân giải cao và đo lường sự phân kỳ (divergence) giữa các thực tại.

#### 1. Detailed Causality Graphing (Rust Engine)
- **Enhanced Event Payload**: Cập nhật `UniverseEvent` để bao gồm `cause_type` và `source_factors` (ví dụ: bạo loạn do famine_score > 0.8).
- **History Buffer**: Triển khai `CausalityBuffer` trong Rust để lưu các sự kiện quan trọng nhất của vài chục tick gần nhất phục vụ phân tích anomaly.

#### 2. Historical Snapshots & Epoch Serialization
- **Epoch Detection**: Tự động đánh dấu các "Turning Points" (Điểm xoay trục) dựa trên sự thay đổi đột ngột của [Archetype](file:///c:/projects/IPFactory/engine/worldos-core/src/types.rs#174-182) hoặc `CivilizationPhase`.
- **High-Res Snapshots**: Cơ chế lưu full state tại các Turning Points để phục vụ `Deterministic Replay`.

#### 3. Divergence Analytics
- **Reality Distance**: Triển khai logic tính toán "Khoảng cách thực tại" giữa Universe Fork và Parent tại cùng một tick.
- **Narrative Reconstruction**: Tự động chuyển đổi chuỗi sự kiện causality thành chuỗi text mô tả lịch sử (Human-readable history logs).

#### 4. Replay & Verification
- Tích hợp chặt chẽ với [DETERMINISTIC_REPLAY.md](file:///c:/projects/IPFactory/backend/docs/DETERMINISTIC_REPLAY.md) để đảm bảo simulation có thể chạy lại chính xác từ bất kỳ Turning Point nào.
