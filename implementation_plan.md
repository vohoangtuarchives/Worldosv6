# Kế hoạch Hoàn thiện Hệ thống WorldOS (Phase 30: 8-Attractor Model)

Dựa trên các Phase trước đã hoàn thiện, đây là kế hoạch chi tiết để hiện thực hóa Pillar 3: Mô hình động lực 8 Trụ cột cho Actor, giúp hành vi mô phỏng đạt độ sâu tâm lý và xã hội.

## User Review Required
> [!IMPORTANT]
> **8-Attractor Alignment**: Toàn bộ hệ thống trường lực (Fields), Văn hóa (Memes) và Động lực (Motivation) sẽ được thống nhất về 8 chiều: Survival, Reproduction, Wealth, Power, Knowledge, Meaning, Status, Belonging. 
> Các tên biến cũ trong DSL (belief_field, ideology_field...) sẽ được thay thế bằng chuẩn mới. Nếu bạn có các script tùy chỉnh dựa trên tên cũ, chúng sẽ cần được cập nhật.

## Proposed Changes

### [MODIFY] `ActorBehaviorEngine.php`
- **File**: `backend/app/Modules/Intelligence/Services/ActorBehaviorEngine.php`
- **Nâng cấp**:
    - Áp dụng bộ 8 `field_*` chuẩn: `field_survival`, `field_reproduction`, `field_wealth`, `field_power`, `field_knowledge`, `field_meaning`, `field_status`, `field_belonging`.
    - Áp dụng bộ 8 `meme_*` chuẩn từ `CultureEngine`.
    - Xóa bỏ các ánh xạ field cũ không tương thích (ideology_field, fear_field...).

### [MODIFY] `cognitive_models.dsl`
- **File**: `backend/resources/worldos_rules/intel/cognitive_models.dsl`
- **Nâng cấp**:
    - Cập nhật quy tắc `Motivation_Synthesis` để bao quát đủ 8 chiều.
    - Cập nhật `Action_Utility_Scoring` để tính điểm Utility dựa trên sự cộng hưởng giữa Động lực cá nhân, Trường lực vùng và meme văn hóa (Văn hóa - Động lực - Môi trường).

### [MODIFY] `ArchetypeClassifier.php`
- **File**: `backend/app/Modules/Intelligence/Domain/Archetype/ArchetypeClassifier.php`
- **Nâng cấp**:
    - Đảm bảo `mapTraitsTo8D` phản ánh đúng các trait liên quan đến 8 chiều mới.
    - Tinh chỉnh `motivationVector` của 12 Archetype cốt lõi để tận dụng đủ 8 chiều (VD: Merchant tập trung vào Wealth & Status).

### [MODIFY] `ZoneFieldCalculator.php`
- **File**: `backend/app/Modules/Intelligence/Services/ZoneFieldCalculator.php`
- **Nâng cấp**:
    - Tinh chỉnh công thức tính toán 8 trường lực từ Actor traits và hành vi (VD: Status ảnh hưởng bởi Pride, Power ảnh hưởng bởi Ambition).

## Phase 31: UI Integration of 8-Attractor Model

Integrating the 8-Attractor Motivation/Field model into the visual UI for consistent 8D monitoring.

### Proposed Changes

#### [MODIFY] [ActorList.tsx](file:///c:/Users/vohoa/Worldosv6/frontend/src/components/Simulation/ActorList.tsx)
- Integrate `AttractorMandala` into the actor details sidebar.
- Display the actor's 8D motivation profile (resonance between traits, fields, and memes).
- Add "Motivation Profile" label and visual separator.

#### [MODIFY] [CosmologicDashboard.tsx](file:///c:/Users/vohoa/Worldosv6/frontend/src/components/dashboard/CosmologicDashboard.tsx)
- Implement the `attractors` sub-tab under "Personae".
- Use `AttractorMandala` for a high-level universe field summary.
- Display list of "Active Attractors" and their current dominance.

#### [NEW] [AttractorSidebarPanel.tsx](file:///c:/Users/vohoa/Worldosv6/frontend/src/components/dashboard/AttractorSidebarPanel.tsx)
- Create a persistent sidebar widget for real-time 8D field monitoring.
- Integrate into the "Observer HUD" right panel.

## Verification Plan

### Manual Verification
- Pulse the simulation and observe real-time updates in the `AttractorMandala`.
- Check different actors to ensure their motivation profiles align with their archetypes.
