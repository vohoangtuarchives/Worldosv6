# WorldOS Expansion: Technical & Metaphysical Design

This document outlines the architectural foundations for the next evolution of WorldOS, integrating ancient wisdom (Wu Xing) with advanced simulation theory (Grand Laws).

## 1. Hệ thống Ngũ Hành (Elemental System - Wu Xing)

The Elemental System is not just a damage modifier; it's a fundamental property of matter and energy in WorldOS.

### Cycle of Interaction
We define two primary cycles in [axioms.json](file:///c:/Users/vohoa/Worldosv6/backend/app/Modules/Simulation/Data/axioms.json):
- **Tương sinh (Generation)**: Kim → Thủy → Mộc → Hỏa → Thổ → Kim.
- **Tương khắc (Overcoming)**: Kim → Mộc → Thổ → Thủy → Hỏa → Kim.

### Integration with Engine
- Mỗi kỹ năng sẽ có trường `element_resonance` (%) để chỉ định mức độ thuần khiết của nguyên tố.
- Trường `world_elemental_density` (Axiom) sẽ thay đổi sức mạnh toàn cục của một hệ (ví dụ: Thế giới "Hỏa diệm sơn" sẽ tăng 200% sát thương hệ Hỏa).

---

## 2. Hệ thống Đại Đạo (Grand Laws - Heavenly Dao)

Grand Laws represent the highest-tier Axioms that govern the reality container.

### A. Thời Không (Space-Time)
- **Time Dilation**: Một kỹ năng có thể tạo ra `TemporalBubble`, làm chậm hoặc nhanh Tick của các Actor đứng bên trong so với World Tick.
- **Space Folding**: Kỹ năng cấp cao có thể bẻ cong tọa độ [(x, y)](file:///c:/Users/vohoa/Worldosv6/frontend/src/components/Simulation/ActorDetail.tsx#181-184) trong simulation, tạo ra hiện tượng "Rút đất thành thốn".

### B. Vận Mệnh & Nhân Quả (Fate & Causality)
- **Karmic Debt**: Mỗi hành động tiêu cực/tích cực của Actor sẽ tích lũy `karma` trong [ActorState](file:///c:/Users/vohoa/Worldosv6/backend/app/Modules/Intelligence/Entities/ActorState.php#9-71). 
- **Destiny Pull**: Các Actor có chỉ số `destiny` cao sẽ có xác suất xảy ra các sự kiện thăng thọa (Ascension) cao hơn.
- **Causality Ripple**: Một thay đổi nhỏ ở quá khứ (Snapshot) có thể gây ra biến động cực lớn ở tương lai thông qua logic `FFI Rule Engine`.

---

## 3. Hệ thống Lưu trữ Chuyên biệt (Dedicated Storage)

Chuyển đổi từ [vocations.json](file:///c:/Users/vohoa/Worldosv6/backend/app/Modules/Simulation/Data/vocations.json) sang mô hình **Vocation Graph Database** (mô phỏng bằng SQL/Cache).

### Schema Dự kiến
- [vocations](file:///c:/Users/vohoa/Worldosv6/frontend/src/lib/api.ts#512-515): id, name, tier, element_affinity, requirements (JSON), evolves_to (Foreign Key).
- `skills`: id, vocation_id, element, cost, rule_dsl (Long Text), metadata (JSON).
- `actor_mastery`: actor_id, skill_id, mastery_level, experience.

### Caching Strategy
- Sử dụng **Redis/Zustand** để giữ toàn bộ DSL rules của các Chức nghiệp active trong bộ nhớ, giảm thiểu IO khi simulation Tick đang chạy.

---

## 4. Lộ trình Phân rã Content
- **Commoners**: (Tier 1) Cơ sở của nền văn minh.
- **Cultivators/Mages**: (Tier 2-4) Bắt đầu chạm vào Quy luật Nguyên tố.
- **Saints/Archons**: (Tier 5) Bắt đầu bẻ cong Quy luật Không gian.
- **Celestial Beings**: (Tier 6) Nắm giữ luân hồi và Nhân quả.
