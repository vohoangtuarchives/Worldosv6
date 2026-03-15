# Kế hoạch tích hợp thế giới Narrative với Rust DSL Engine

Thực tế là Core Rust Engine (worldos-rules) của WorldOS V6 đã được triển khai xong (tại `engine/worldos-rules`), hỗ trợ DSL custom (text) với syntax:
```dsl
rule rule_name
  priority 100
  scope civilization
  when
    path > value
  or
    path < value
  chance 1.0
  then
    emit_event EVENT_NAME
    add path value
    set path value
```

## Các Bước Triển Khai

### Phase 1: Thư mục & Hệ thống Rule (Rust)
- Thay vì định dạng YAML như kế hoạch trên, ta sẽ viết các file text (`.dsl`) sử dụng trực tiếp engine `worldos-rules`.
- Tạo thư mục `resources/worldos_rules` nếu chưa có. Cấu trúc chia theo thư mục (belief, legend, culture...).

### Phase 2: Thay thế Hardcoded Logic -> DSL Rules
Tập trung vào 2 phần cốt lõi từ `TraitMapper`:
1. **Fate Tags (Legend Creation):** Tạo `resources/worldos_rules/legend/fate_tags.dsl`.
    - Ví dụ: `rule The_Conqueror` khi `trait.ambition > 0.95 and trait.dominance > 0.95`.
    - Gọi action `add legend "The Conqueror"`.
2. **Archetype Shift (Evolution Engine):** Tạo `resources/worldos_rules/culture/archetypes.dsl`.
    - Thay thế logic nâng bậc (từ Commoner -> Sage, Commoner -> Opportunist).

### Phase 3: Kết nối Backend PHP -> Rust (Tương lai)
- Vì Rust engine có cấu trúc RuleGraph (thậm chí support self-improving qua AI dependencies), PHP sẽ collect Event và gọi qua Rust (qua UDP hoặc FFI) để đánh giá State (tính năng của module `worldos-ffi` / `worldos-grpc`).
- Trong backend PHP, xoá bỏ dần hard-coded logic tương ứng.
