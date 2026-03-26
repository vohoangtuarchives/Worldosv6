# Sơ đồ Thành phần (Component Diagram) - Backend Core

## Tổng quan
Backend của WorldOS V6 được xây dựng trên Laravel 12 theo kiến trúc **Modular Monolith**. Mỗi module chịu trách nhiệm cho một miền nghiệp vụ (Domain) cụ thể.

## Sơ đồ Mermaid

```mermaid
C4Component
    title Sơ đồ Thành phần Backend WorldOS V6

    Container_Boundary(api_core, "Laravel API Core") {
        Component(worldos_mod, "Module WorldOS", "Laravel Module", "Cổng giao tiếp chính, quản lý Universe, Worlds và Narrative.")
        Component(sim_mod, "Module Simulation", "Laravel Module", "Quản lý vòng đời mô phỏng (Tick logic, Snapshots, Epochs).")
        Component(intel_mod, "Module Intelligence", "Laravel Module", "Xử lý AI Agent, Decision Engine và sự tiến hóa văn minh.")
        Component(nar_mod, "Module Narrative", "Laravel Module", "Tổng hợp biên niên sử (Chronicle) và xây dựng thần văn (Mythos).")
        Component(soc_mod, "Module SocialGraph", "Laravel Module", "Quản lý quan hệ giữa các Actors, Factions và Institutions.")
        
        Component(repo, "Repositories Layer", "Eloquent/Neo4j", "Trừu tượng hóa việc truy cập dữ liệu.")
        Component(action, "Actions Layer", "Use Cases", "Thực thi các logic nghiệp vụ đơn lẻ (Single Responsibility).")
    }

    System_Ext(rust_sim, "Rust Sim Engine", "Thực hiện tính toán mô phỏng thô.")
    System_Ext(db_pg, "PostgreSQL", "Dữ liệu trạng thái & TimescaleDB.")
    System_Ext(db_neo, "Neo4j", "Dữ liệu đồ thị cốt truyện.")

    Rel(worldos_mod, action, "Gọi", "Internal")
    Rel(sim_mod, action, "Gọi", "Internal")
    Rel(action, repo, "Sử dụng", "Internal")
    Rel(repo, db_pg, "Đọc/Ghi", "Eloquent")
    Rel(repo, db_neo, "Đọc/Ghi", "Cypher")
    Rel(sim_mod, rust_sim, "Giao tiếp", "gRPC/HTTP")
```

## Giải thích các Module chính
- **WorldOS**: Module bề mặt, cung cấp các API cho Frontend và quản lý các thực thể cấp cao như Đấng sáng tạo (Demiurges).
- **Simulation**: Điều phối `EpochEngine` và `ProphecyEngine`. Chịu trách nhiệm chuyển giao kỷ nguyên và quản lý dòng thời gian.
- **Intelligence**: Chứa các "Engine Swarm" để mô phỏng trí tuệ tập thể và các quyết định của Agent.
- **Narrative**: Chuyển đổi các sự kiện thô từ mô phỏng thành ngôn ngữ tự nhiên (Sử gia).
- **SocialGraph**: Mô phỏng sự tương tác phức tạp trong xã hội ảo.
