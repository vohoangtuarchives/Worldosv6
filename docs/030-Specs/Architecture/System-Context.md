# Sơ đồ Ngữ cảnh Hệ thống (System Context Diagram)

## Tổng quan
WorldOS V6 là một hệ thống mô phỏng vũ trụ đa tầng, cho phép người dùng (Người quan sát) theo dõi và tác động đến sự tiến hóa của các nền văn minh thông qua giao diện điều khiển cấp cao.

## Sơ đồ Mermaid

```mermaid
C4Context
    title Sơ đồ Ngữ cảnh Hệ thống WorldOS V6

    Person(observer, "Người quan sát (Observer)", "Người dùng cuối theo dõi và điều khiển các giả lập vũ trụ.")
    
    System_Boundary(worldos_v6, "Hệ thống WorldOS V6") {
        System(frontend, "Giao diện Console (Next.js)", "Cung cấp dashboard Observer Console, công cụ visualization và điều khiển.")
        System(backend, "API Core (Laravel 12)", "Quản lý dữ liệu, xác thực, và điều phối logic nghiệp vụ đa module.")
        System(sim_engine, "Simulation Engine (Rust)", "Trái tim của hệ thống, thực hiện các phép tính vật lý, xã hội và lịch sử ở tốc độ cao.")
    }

    System_Ext(neo4j, "Cơ sở dữ liệu Đồ thị (Neo4j)", "Lưu trữ cấu trúc cốt truyện (Narrative Pipeline) và các mối quan hệ xã hội phức tạp.")
    System_Ext(postgres, "CSDL Quan hệ (PostgreSQL/TimescaleDB)", "Lưu trữ trạng thái vũ trụ, biên niên sử và các snapshot theo thời gian thực.")
    System_Ext(redis, "Bộ nhớ đệm (Redis)", "Xử lý hàng đợi sự kiện và cache trạng thái mô phỏng.")

    Rel(observer, frontend, "Sử dụng", "HTTPS")
    Rel(frontend, backend, "Gọi API", "JSON/HTTP")
    Rel(backend, sim_engine, "Điều khiển mô phỏng/Lấy dữ liệu tick", "gRPC/HTTP")
    Rel(backend, postgres, "Đọc/Ghi dữ liệu trạng thái", "SQL")
    Rel(backend, neo4j, "Quản lý Narrative Graph", "Cypher")
    Rel(sim_engine, postgres, "Ghi logs/Snapshots", "SQL")
    Rel(backend, redis, "Quản lý Jobs/Cache", "TCP")
```

## Các thành phần chính
1. **Người quan sát (Observer)**: Vai trò của người dùng trong hệ thống, có khả năng can thiệp vào các quy luật (Axioms) của vũ trụ.
2. **Giao diện Console**: Được thiết kế dưới dạng "Observer's Console" toàn màn hình, tập trung vào trải nghiệm nhập vai.
3. **API Core**: Triển khai theo mô hình Modular Monolith, giúp dễ dàng mở rộng và bảo trì các tính năng như Tâm lý học (Psychology), Xã hội (Social Graph), v.v.
4. **Simulation Engine**: Xử lý logic mô phỏng cực nhanh bằng Rust, tách biệt khỏi logic nghiệp vụ của backend.
5. **Data Layer**: Sử dụng mô hình Hybrid giữa SQL (dữ liệu chuỗi thời gian) và Graph (dữ liệu quan hệ lịch sử).
